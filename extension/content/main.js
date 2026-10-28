/**
 * Point d'entrée du content script, chargé sur x.com et twitter.com.
 *
 * Chaque tweet ou notification qui apparaît est noté par le détecteur. S'il
 * est haineux, il est flouté avant d'être visible. X change son DOM en
 * permanence : un MutationObserver traite les ajouts tout de suite, et une
 * passe complète tourne régulièrement en filet de sécurité.
 */
import { scoreText } from "../detection/score.js";
import { initHud, setHudCount, setHudEnabled } from "./hud.js";
import { applyStoredHandles, initOwnHandles, isOwnContent } from "./own-handles.js";
import {
  forgetKey,
  hiddenCount,
  isHiddenKey,
  isTreated,
  onHiddenCountChange,
  treat,
  untreat,
  untreatAll,
} from "./treat.js";
import { extractAuthor, extractText, findObserverRoot, findUnits, unitKey } from "./x-dom.js";

// Un texte plus long n'apporte rien au détecteur et coûte du temps.
const MAX_TEXT_LENGTH = 4000;
// Assez court pour regrouper les rafales de mutations de X dans une seule passe.
const RESCAN_DELAY_MS = 16;
const SAFETY_RESCAN_MS = 3000;

let enabled = true;
let rescanTimer = 0;

/**
 * Dernier verdict par élément, pour ne pas renoter un tweet qui n'a pas changé.
 * @type {WeakMap<HTMLElement, { key: string, text: string, hateful: boolean }>}
 */
const verdicts = new WeakMap();

/** @param {HTMLElement} unit tweet ou notification */
function processUnit(unit) {
  const key = unitKey(unit);
  if (isOwnContent(unit, extractAuthor(unit))) {
    forgetKey(key);
    untreat(unit);
    return;
  }
  // Déjà jugé haineux plus tôt dans la session : on remasque sans renoter.
  if (isHiddenKey(key)) {
    treat(unit, key);
    return;
  }

  const text = extractText(unit).slice(0, MAX_TEXT_LENGTH);
  if (!text) return;
  let verdict = verdicts.get(unit);
  if (verdict?.key !== key || verdict.text !== text) {
    verdict = { key, text, hateful: scoreText({ text }).match };
    verdicts.set(unit, verdict);
  }
  if (verdict.hateful) treat(unit, key);
  else untreat(unit);
}

function scan() {
  if (enabled) findUnits(document).forEach(processUnit);
}

function scheduleScan() {
  window.clearTimeout(rescanTimer);
  rescanTimer = window.setTimeout(scan, RESCAN_DELAY_MS);
}

/** @param {MutationRecord[]} mutations */
function onMutations(mutations) {
  if (!enabled) return;
  let rescan = false;
  for (const mutation of mutations) {
    if (mutation.type === "characterData" || mutation.removedNodes.length) rescan = true;
    for (const node of mutation.addedNodes) {
      if (!(node instanceof HTMLElement)) continue;
      // Un nouveau tweet est traité tout de suite, pour ne jamais apparaître en clair.
      findUnits(node).forEach(processUnit);
      // X a recréé un morceau d'un tweet masqué : il faut le flouter aussi.
      const parent = node.parentElement;
      if (parent && isTreated(parent)) processUnit(parent);
    }
  }
  if (rescan) scheduleScan();
}

/** @param {boolean} on */
function setEnabled(on) {
  enabled = on;
  setHudEnabled(on);
  if (on) scan();
  else untreatAll();
}

async function start() {
  document.documentElement.dataset.voyou = "actif";
  const settings = await chrome.storage.local.get({ enabled: true });
  enabled = settings.enabled !== false;

  await initOwnHandles(scheduleScan);
  await initHud();
  setHudEnabled(enabled);
  setHudCount(hiddenCount());
  onHiddenCountChange(setHudCount);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.ownHandles) {
      applyStoredHandles(changes.ownHandles.newValue);
      scheduleScan();
    }
    if (changes.enabled) setEnabled(changes.enabled.newValue !== false);
  });

  scan();
  new MutationObserver(onMutations).observe(findObserverRoot(), {
    childList: true,
    subtree: true,
    characterData: true,
  });
  setInterval(scheduleScan, SAFETY_RESCAN_MS);
  addEventListener("popstate", scheduleScan);
}

start();
