/**
 * Point d'entrée du content script, chargé sur x.com et twitter.com.
 *
 * Chaque tweet, tweet cité, notification, carte de compte ou bio qui apparaît
 * est noté par le détecteur. S'il est haineux, il est flouté avant d'être
 * visible. X change son DOM en permanence : un MutationObserver sur toute la
 * page renote tout de suite chaque unité ajoutée ou modifiée, et une passe
 * complète tourne régulièrement en filet de sécurité.
 */
import { scoreText, warmUpSteps } from "../detection/score.js";
import { categoryLabel, getLocale, setLocale } from "../i18n.js";
import { guard, onShutdown } from "../lifecycle.js";
import { SETTING_KEYS, loadSettings, sanitizeSettings, saveSettings } from "../settings.js";
import { pruneStats, recordHidden } from "../stats.js";
import { initHud, rebuildHud, setHudCount, setHudEnabled, setHudTheme } from "./hud.js";
import { applyStoredHandles, initOwnHandles, isOwnContent } from "./own-handles.js";
import {
  STATE,
  UI_SELECTOR,
  forgetHidden,
  forgetKey,
  isHidden,
  isHiddenKey,
  newPage,
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
  findQuote,
  findUnits,
  unitKey,
  unitKind,
  unitOf,
} from "./x-dom.js";

// Un texte plus long n'apporte rien au détecteur et coûte du temps.
const MAX_TEXT_LENGTH = 4000;
const SAFETY_RESCAN_MS = 3000;

let settings = sanitizeSettings({});
/** @type {Set<string>} */
let allowed = new Set();
// Change quand un réglage de notation change : invalide les verdicts en cache.
let settingsVersion = 0;
let scoringKey = "";
// Adresse de la dernière passe complète : le compte d'une bio ou d'un nom de
// profil en dépend.
let scannedPath = location.pathname;

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

/**
 * @param {import("../settings.js").Settings} next
 * @returns {boolean} vrai si les verdicts en cache ne valent plus rien
 */
function applySettings(next) {
  settings = next;
  allowed = new Set(next.allowedHandles);
  // Les comptes autorisés et l'interrupteur ne changent aucun verdict.
  const key = JSON.stringify([next.sensitivity, next.categories, next.customTerms, next.mutedRules]);
  if (key === scoringKey) return false;
  scoringKey = key;
  settingsVersion++;
  return true;
}

/**
 * Note un texte, ou reprend le verdict en cache s'il n'a pas changé.
 * @param {Element} source élément d'où vient le texte
 * @param {string} text
 * @param {import("../detection/score.js").Scope} [scope] "name" pour un nom d'affichage
 * @returns {Verdict}
 */
function judge(source, text, scope = "message") {
  const cached = verdicts.get(source);
  if (cached?.text === text && cached.version === settingsVersion) return cached;
  const result = scoreText({
    text: text.slice(0, MAX_TEXT_LENGTH),
    sensitivity: settings.sensitivity,
    categories: settings.categories,
    customTerms: settings.customTerms,
    mutedRules: settings.mutedRules,
    scope,
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
 * @param {boolean} [post] post ou tweet cité : barre d'actions même s'il est petit
 */
function apply(el, key, verdict, author, post = false) {
  if (verdict?.category) {
    applied.set(el, verdict);
    if (!counted.has(key)) {
      counted.add(key);
      recordHidden(verdict.category);
    }
    treat(el, key, { reason: categoryLabel(verdict.category), author, post });
  } else if (isHiddenKey(key)) {
    // Déjà masqué dans la session : on le garde masqué même si X l'a recréé
    // avec un texte légèrement différent (compteurs, traduction…).
    treat(el, key, { reason: "", author, post });
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
  const displayName = kind === "tweet" && !verdict?.category ? extractDisplayName(unit) : null;
  if (displayName) {
    const byName = judge(displayName.source, displayName.name, "name");
    if (byName.category) verdict = byName;
  }
  apply(unit, key, verdict, author, kind === "tweet");

  // Le tweet cité est noté à part : si seul lui est haineux, seul lui est flouté.
  if (!quote) return;
  if (isHidden(unit)) {
    untreat(quote);
    return;
  }
  // Un compte autorisé ne voit pas non plus ses tweets cités masqués.
  const quoteAuthor = extractAuthor(quote);
  if (quoteAuthor && allowed.has(quoteAuthor.toLowerCase())) {
    forgetKey(`quote:${key}`);
    untreat(quote);
    return;
  }
  const quoteText = extractQuoteText(quote);
  apply(quote, `quote:${key}`, quoteText ? judge(quote, quoteText) : null, quoteAuthor, true);
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
  // Nouvelle adresse : le compteur, qui dit ce qui est masqué sur la page, repart de zéro.
  if (location.pathname !== scannedPath) newPage();
  scannedPath = location.pathname;
  findUnits(document).forEach(processUnit);
}

/**
 * Vrai pour une mutation que Voyou a faite lui-même et qui n'a rien à
 * renoter : son interface (voile, barre) ajoutée ou retirée, l'état posé ou
 * retiré par une passe. Un état qui passe de masqué à révélé ou l'inverse
 * (« Afficher quand même », « Masquer ») n'en est pas : le tweet cité doit suivre.
 * @param {MutationRecord} mutation
 */
function isOwnMutation(mutation) {
  if (mutation.type === "attributes") {
    const state = mutation.target instanceof Element ? mutation.target.getAttribute(STATE) : null;
    return !mutation.oldValue || !state || state === mutation.oldValue;
  }
  if (mutation.type !== "childList") return false;
  return [...mutation.addedNodes, ...mutation.removedNodes].every(
    (node) => node instanceof Element && node.matches(UI_SELECTOR),
  );
}

/**
 * Renote, avant la prochaine image, chaque unité ajoutée ou modifiée : texte
 * rendu après le reste du tweet, morceau recréé par X, tweet cité dont le
 * tweet vient d'être affiché ou masqué.
 * @param {MutationRecord[]} mutations
 */
function onMutations(mutations) {
  if (!settings.enabled) return;
  // X a changé de page sans recharger : tout est renoté avec la nouvelle adresse.
  if (location.pathname !== scannedPath) {
    scan();
    return;
  }
  /** @type {Set<Element>} */
  const changed = new Set();
  /** @type {Set<HTMLElement>} */
  const units = new Set();
  for (const mutation of mutations) {
    if (isOwnMutation(mutation)) continue;
    const { target } = mutation;
    const el = target instanceof Element ? target : target.parentElement;
    if (el) changed.add(el);
    for (const node of mutation.addedNodes) {
      if (node instanceof HTMLElement) for (const unit of findUnits(node)) units.add(unit);
    }
  }
  for (const el of changed) {
    const unit = unitOf(el);
    // Les libellés de l'interface de Voyou ne disent rien du tweet.
    if (unit && !el.closest(UI_SELECTOR)) units.add(unit);
  }
  for (const unit of units) if (unit.isConnected) processUnit(unit);
}

/** @param {{ [key: string]: chrome.storage.StorageChange }} changes */
async function onStorageChange(changes) {
  if (changes.ownHandles) {
    applyStoredHandles(changes.ownHandles.newValue);
    scan();
  }
  if (!SETTING_KEYS.some((key) => key in changes)) return;
  const wasEnabled = settings.enabled;
  const rescore = applySettings(await loadSettings());
  setHudEnabled(settings.enabled);
  if (rescore || settings.enabled !== wasEnabled) {
    // Les éléments masqués avec les anciens réglages sont renotés avec les nouveaux.
    forgetHidden();
    untreatAll();
  }
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
 * utilisation, en deux versions : texte Latin-1, texte avec emojis ou autres
 * alphabets. Ce travail, mots perso compris, est fait une fois la page
 * protégée, pendant les temps morts du navigateur, plutôt que sur les premiers
 * tweets, une regex à la fois : d'un bloc, il bloquerait la page plus de
 * 200 ms.
 */
function warmUpDetector() {
  if (!settings.enabled) return;
  const steps = warmUpSteps(settings.customTerms);
  /** @param {IdleDeadline} deadline */
  const step = (deadline) => {
    // Au moins un pas par rappel, sinon une page jamais au repos l'affamerait.
    do if (steps.next().done) return;
    while (deadline.timeRemaining() > 5);
    requestIdleCallback(step);
  };
  requestIdleCallback(step);
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
    // Les voiles sont refaits dans la nouvelle langue dans la même tâche, sans
    // laisser peindre une image où ils manquent. Le panneau suit.
    untreatAll();
    scan();
    await rebuildHud({ dark: document.documentElement.dataset.voyouTheme === "dark" });
  };
  setLocale(document.documentElement.lang || navigator.language);
  chrome.storage.local.set({ uiLang: getLocale() });
  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  onShutdown(() => observer.disconnect());
}

async function start() {
  followXLanguage();
  applySettings(await loadSettings());
  // Les statistiques ne gardent que les derniers jours, même si plus rien n'est masqué.
  pruneStats();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") onStorageChange(changes);
  });
  await initOwnHandles(scan);
  onHiddenCountChange(setHudCount);

  // Sous Firefox, une mise à jour réinjecte ce script dans les onglets ouverts
  // sans rien laisser exécuter à l'ancien : ses voiles, posés peut-être sur des
  // éléments que cette version ne note plus, sont refaits ici, dans la même
  // tâche que la passe.
  untreatAll();
  scan();
  // Toute la page : #layers (photos, fenêtres de réponse) et la colonne de
  // droite sont hors de la colonne principale, que X peut d'ailleurs remplacer.
  new MutationObserver(onMutations).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    // « Afficher quand même » et « Masquer » ne changent que cet attribut.
    attributeFilter: [STATE],
    attributeOldValue: true,
  });
  // Coupé de l'extension par une mise à jour, l'onglet continue de flouter avec
  // les derniers réglages : ni l'observateur ni cette passe ne s'arrêtent.
  window.setInterval(scan, SAFETY_RESCAN_MS);

  await initHud({ dark: document.documentElement.dataset.voyouTheme === "dark" });
  setHudEnabled(settings.enabled);
  warmUpDetector();
}

start();
