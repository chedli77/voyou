/**
 * Point d'entrée du content script, chargé sur x.com et twitter.com.
 *
 * Chaque tweet ou notification qui apparaît est noté par le détecteur. S'il
 * est haineux, il est flouté avant d'être visible. X change son DOM en
 * permanence : un MutationObserver traite les ajouts tout de suite, et une
 * passe complète tourne régulièrement en filet de sécurité.
 */
import { categoryLabel } from "../detection/categories.js";
import { scoreText } from "../detection/score.js";
import { SETTING_KEYS, loadSettings, sanitizeSettings } from "../settings.js";
import { initHud, setHudCount, setHudEnabled } from "./hud.js";
import { applyStoredHandles, initOwnHandles, isOwnContent } from "./own-handles.js";
import {
  forgetHidden,
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

let settings = sanitizeSettings({});
/** @type {Set<string>} */
let allowed = new Set();
// Change à chaque modification des réglages : invalide les verdicts en cache.
let settingsVersion = 0;
let rescanTimer = 0;

/**
 * Dernier verdict par élément, pour ne pas renoter un tweet qui n'a pas changé.
 * @type {WeakMap<HTMLElement, { key: string, text: string, version: number, reason: string | null }>}
 */
const verdicts = new WeakMap();

/** @param {import("../settings.js").Settings} next */
function applySettings(next) {
  settings = next;
  allowed = new Set(next.allowedHandles);
  settingsVersion++;
}

/** @param {HTMLElement} unit tweet ou notification */
function processUnit(unit) {
  const key = unitKey(unit);
  const author = extractAuthor(unit);
  if (isOwnContent(unit, author) || (author && allowed.has(author.toLowerCase()))) {
    forgetKey(key);
    untreat(unit);
    return;
  }

  const text = extractText(unit).slice(0, MAX_TEXT_LENGTH);
  if (!text) return;
  let verdict = verdicts.get(unit);
  if (verdict?.key !== key || verdict.text !== text || verdict.version !== settingsVersion) {
    const result = scoreText({ text, sensitivity: settings.sensitivity, categories: settings.categories });
    verdict = {
      key,
      text,
      version: settingsVersion,
      reason: result.match ? categoryLabel(result.categories[0]) : null,
    };
    verdicts.set(unit, verdict);
  }
  // Un tweet déjà masqué dans la session reste masqué, même si X l'a recréé
  // avec un texte légèrement différent (compteurs, traduction…).
  if (verdict.reason) treat(unit, key, verdict.reason);
  else if (isHiddenKey(key)) treat(unit, key, "");
  else untreat(unit);
}

function scan() {
  if (settings.enabled) findUnits(document).forEach(processUnit);
}

function scheduleScan() {
  window.clearTimeout(rescanTimer);
  rescanTimer = window.setTimeout(scan, RESCAN_DELAY_MS);
}

/** @param {MutationRecord[]} mutations */
function onMutations(mutations) {
  if (!settings.enabled) return;
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

/** @param {{ [key: string]: chrome.storage.StorageChange }} changes */
async function onStorageChange(changes) {
  if (changes.ownHandles) {
    applyStoredHandles(changes.ownHandles.newValue);
    scheduleScan();
  }
  if (!SETTING_KEYS.some((key) => key in changes)) return;
  applySettings(await loadSettings());
  setHudEnabled(settings.enabled);
  // Les tweets masqués avec les anciens filtres sont renotés avec les nouveaux.
  forgetHidden();
  untreatAll();
  scan();
}

async function start() {
  document.documentElement.dataset.voyou = "actif";
  applySettings(await loadSettings());

  await initOwnHandles(scheduleScan);
  await initHud();
  setHudEnabled(settings.enabled);
  setHudCount(hiddenCount());
  onHiddenCountChange(setHudCount);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") onStorageChange(changes);
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
