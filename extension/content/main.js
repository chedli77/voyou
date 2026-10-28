/**
 * Point d'entrée du content script, chargé sur x.com et twitter.com.
 *
 * Chaque tweet, tweet cité, notification, carte de compte ou bio qui apparaît
 * est noté par le détecteur. S'il est haineux, il est flouté avant d'être
 * visible. X change son DOM en permanence : un MutationObserver traite les
 * ajouts tout de suite, et une passe complète tourne régulièrement en filet
 * de sécurité.
 */
import { scoreText } from "../detection/score.js";
import { categoryLabel, getLocale, setLocale } from "../i18n.js";
import { every, guard, onShutdown } from "../lifecycle.js";
import { SETTING_KEYS, loadSettings, sanitizeSettings, saveSettings } from "../settings.js";
import { recordHidden } from "../stats.js";
import { initHud, rebuildHud, setHudCount, setHudEnabled, setHudTheme } from "./hud.js";
import { applyStoredHandles, initOwnHandles, isOwnContent } from "./own-handles.js";
import {
  forgetHidden,
  forgetKey,
  hiddenCount,
  isHiddenKey,
  isTreated,
  onHiddenCountChange,
  setActions,
  treat,
  untreat,
  untreatAll,
} from "./treat.js";
import {
  extractAuthor,
  extractDisplayName,
  extractQuoteText,
  extractText,
  findObserverRoot,
  findQuote,
  findUnits,
  unitKey,
  unitKind,
  unitOf,
} from "./x-dom.js";

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
 * @typedef {object} Verdict
 * @property {string} text
 * @property {number} version
 * @property {string | null} category catégorie principale, null si rien à masquer
 * @property {string[]} ruleIds règles qui ont joué, pour « Ce n'est pas de la haine »
 */

/**
 * Derniers verdicts, par texte noté, pour ne pas renoter ce qui n'a pas
 * changé. La clé est l'élément de X d'où vient le texte.
 * @type {WeakMap<Element, Verdict>}
 */
const verdicts = new WeakMap();
/**
 * Verdict qui a fait masquer chaque élément (texte, nom d'affichage ou tweet cité).
 * @type {WeakMap<HTMLElement, Verdict>}
 */
const applied = new WeakMap();
/** @type {Set<string>} clés déjà comptées dans les statistiques pendant la session */
const counted = new Set();

/** @param {import("../settings.js").Settings} next */
function applySettings(next) {
  settings = next;
  allowed = new Set(next.allowedHandles);
  settingsVersion++;
}

/**
 * Note un texte, ou reprend le verdict en cache s'il n'a pas changé.
 * @param {Element} source élément d'où vient le texte
 * @param {string} text
 * @returns {Verdict}
 */
function judge(source, text) {
  const cached = verdicts.get(source);
  if (cached?.text === text && cached.version === settingsVersion) return cached;
  const result = scoreText({
    text: text.slice(0, MAX_TEXT_LENGTH),
    sensitivity: settings.sensitivity,
    categories: settings.categories,
    customTerms: settings.customTerms,
    mutedRules: settings.mutedRules,
  });
  /** @type {Verdict} */
  const verdict = {
    text,
    version: settingsVersion,
    category: result.match ? result.categories[0] : null,
    ruleIds: result.matches.map((m) => m.id),
  };
  verdicts.set(source, verdict);
  return verdict;
}

/**
 * Masque ou démasque un élément selon son verdict.
 * @param {HTMLElement} el
 * @param {string} key
 * @param {Verdict | null} verdict null : rien à masquer
 * @param {string | null} author
 */
function apply(el, key, verdict, author) {
  if (verdict?.category) {
    applied.set(el, verdict);
    if (!counted.has(key)) {
      counted.add(key);
      recordHidden(verdict.category);
    }
    treat(el, key, { reason: categoryLabel(verdict.category), author });
  } else if (isHiddenKey(key)) {
    // Déjà masqué dans la session : on le garde masqué même si X l'a recréé
    // avec un texte légèrement différent (compteurs, traduction…).
    treat(el, key, { reason: "", author });
  } else {
    untreat(el);
  }
}

/** @param {HTMLElement} unit */
function processUnit(unit) {
  const key = unitKey(unit);
  const kind = unitKind(unit);
  const author = extractAuthor(unit);
  const quote = kind === "tweet" ? findQuote(unit) : null;
  if (isOwnContent(unit, author) || (author && allowed.has(author.toLowerCase()))) {
    forgetKey(key);
    untreat(unit);
    if (quote) untreat(quote);
    return;
  }

  const text = extractText(unit);
  let verdict = text ? judge(unit, text) : null;
  // Un nom d'affichage haineux suffit à masquer le tweet.
  const nameBlock = kind === "tweet" ? unit.querySelector('[data-testid="User-Name"]') : null;
  const name = kind === "tweet" && !verdict?.category ? extractDisplayName(unit) : "";
  if (name) {
    const byName = judge(nameBlock ?? unit.querySelector("a") ?? unit, name);
    if (byName.category) verdict = byName;
  }
  apply(unit, key, verdict, author);

  // Le tweet cité est noté à part : si seul lui est haineux, seul lui est flouté.
  if (!quote) return;
  if (unit.getAttribute("data-voyou-state") === "hidden") {
    untreat(quote);
    return;
  }
  const quoteText = extractQuoteText(quote);
  apply(quote, `quote:${key}`, quoteText ? judge(quote, quoteText) : null, extractAuthor(quote));
}

/**
 * Suit le thème de X (clair, ou sombre « Dim » et « Lights out ») pour
 * accorder le voile, la barre d'actions et le compteur.
 */
function syncTheme() {
  const background = getComputedStyle(document.body ?? document.documentElement).backgroundColor;
  const [r = 255, g = 255, b = 255, alpha = 1] = background.match(/[\d.]+/g)?.map(Number) ?? [];
  const dark = alpha > 0 && 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
  const theme = dark ? "dark" : "light";
  if (document.documentElement.dataset.voyouTheme === theme) return;
  document.documentElement.dataset.voyouTheme = theme;
  setHudTheme(dark);
}

function scan() {
  syncTheme();
  if (!settings.enabled) return;
  findUnits(document).forEach(processUnit);
}

function scheduleScan() {
  if (!guard()) return;
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
      // Un nouvel élément est traité tout de suite, pour ne jamais apparaître en clair.
      findUnits(node).forEach(processUnit);
      // X a recréé un morceau d'un élément masqué : on renote l'unité qui le contient.
      const parent = node.parentElement;
      const unit = parent && isTreated(parent) ? unitOf(parent) : null;
      if (unit) processUnit(unit);
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
  // Les éléments masqués avec les anciens réglages sont renotés avec les nouveaux.
  forgetHidden();
  untreatAll();
  scan();
}

setActions({
  // Désactive, pour cet utilisateur seulement, les règles qui ont masqué ce message.
  notHate(el) {
    const ruleIds = (applied.get(el)?.ruleIds ?? []).filter((id) => !id.startsWith("custom-"));
    if (ruleIds.length) saveSettings({ mutedRules: [...new Set([...settings.mutedRules, ...ruleIds])] });
  },
  allow(handle) {
    saveSettings({ allowedHandles: [...new Set([...settings.allowedHandles, handle.toLowerCase()])] });
  },
});

/**
 * Le moteur JavaScript compile les regex du détecteur à leur première
 * utilisation, en deux versions (texte Latin-1, texte avec emojis ou autres
 * alphabets), puis les recompile en code natif après quelques appels. On fait
 * ce travail quand le navigateur est inactif, pas sur le premier tweet.
 */
function warmUpDetector() {
  const samples = ["warm up", "sale b*ugnoule 🐒", "vuelve a tu país", "você é um idiota", "kys 4 r34l"];
  const run = () => samples.forEach((text) => scoreText({ text }));
  if (typeof requestIdleCallback === "function") requestIdleCallback(() => [1, 2, 3].forEach(run));
  else window.setTimeout(() => [1, 2, 3].forEach(run), 0);
}

/**
 * L'interface parle la langue de X : l'attribut lang de la page suit le
 * réglage de langue du compte. Elle est gardée pour la popup, qui n'est pas
 * dans X, et suivie si l'utilisateur la change sans recharger.
 */
function followXLanguage() {
  const sync = async () => {
    if (!guard()) return;
    const previous = getLocale();
    setLocale(document.documentElement.lang || navigator.language);
    if (getLocale() === previous) return;
    chrome.storage.local.set({ uiLang: getLocale() });
    // Les voiles et le panneau sont reconstruits dans la nouvelle langue.
    untreatAll();
    await rebuildHud({ dark: document.documentElement.dataset.voyouTheme === "dark" });
    scan();
  };
  setLocale(document.documentElement.lang || navigator.language);
  chrome.storage.local.set({ uiLang: getLocale() });
  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  onShutdown(() => observer.disconnect());
}

async function start() {
  document.documentElement.dataset.voyou = "actif";
  followXLanguage();
  warmUpDetector();
  applySettings(await loadSettings());

  await initOwnHandles(scheduleScan);
  syncTheme();
  await initHud({ dark: document.documentElement.dataset.voyouTheme === "dark" });
  setHudEnabled(settings.enabled);
  setHudCount(hiddenCount());
  onHiddenCountChange(setHudCount);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") onStorageChange(changes);
  });

  scan();
  const observer = new MutationObserver(onMutations);
  observer.observe(findObserverRoot(), { childList: true, subtree: true, characterData: true });
  onShutdown(() => {
    observer.disconnect();
    window.clearTimeout(rescanTimer);
  });
  every(SAFETY_RESCAN_MS, scheduleScan);
  addEventListener("popstate", scheduleScan);
}

start();
