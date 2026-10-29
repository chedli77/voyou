/**
 * Point d'entrée du content script, chargé sur x.com et twitter.com.
 *
 * Chaque tweet, tweet cité, carte de lien, notification, carte de compte ou
 * bio qui apparaît est noté par le détecteur. S'il est haineux, il est flouté
 * avant d'être visible. X change son DOM en permanence : un MutationObserver
 * sur toute la page renote tout de suite chaque unité ajoutée ou modifiée, et
 * une passe complète tourne régulièrement en filet de sécurité. Le titre de
 * l'onglet, où X recopie le post ouvert, est noté lui aussi.
 */
import { scoreText, warmUpSteps } from "../detection/score.js";
import { categoryLabel, getLocale, setLocale, t } from "../i18n.js";
import { guard, onShutdown } from "../lifecycle.js";
import { SETTING_KEYS, loadSettings, sanitizeSettings, saveSettings } from "../settings.js";
import { pruneStats, recordHidden } from "../stats.js";
import { initHud, rebuildHud, setHudCount, setHudEnabled, setHudTheme } from "./hud.js";
import { applyStoredHandles, initOwnHandles, isAboutOwnPost, isOwnHandle } from "./own-handles.js";
import {
  STATE,
  UI_SELECTOR,
  forgetHidden,
  forgetKey,
  isHidden,
  isHiddenKey,
  newPage,
  onHiddenCountChange,
  releaseHidden,
  setActions,
  treat,
  untreat,
  untreatAll,
} from "./treat.js";
import {
  extractAuthor,
  extractCardText,
  extractDisplayName,
  extractNames,
  extractQuoteText,
  extractSocialContext,
  extractText,
  findCard,
  findQuote,
  findUnits,
  handleFromHref,
  unitKey,
  unitKind,
  unitOf,
} from "./x-dom.js";

/** @typedef {import("./x-dom.js").DisplayName} DisplayName */

// Le détecteur tient son temps de réponse jusqu'à 4 000 caractères. Un post
// plus long (jusqu'à 25 000 sur X) est noté par tranches, qui se chevauchent
// de plus que la portée de ses motifs : une tournure à cheval sur une coupure
// est entière dans l'une des deux.
const MAX_TEXT_LENGTH = 4000;
const OVERLAP = 500;
const SAFETY_RESCAN_MS = 3000;
let settings = sanitizeSettings({});
/** @type {Set<string>} */
let allowed = new Set();
// Change quand un réglage de notation change : invalide les verdicts en cache.
let settingsVersion = 0;
let scoringKey = "";
// Adresse de la dernière passe complète : ce qui est noté en dépend (page des
// notifications, compte d'une bio, titre de l'onglet).
let scannedPath = location.pathname;
// X recopie le post ouvert dans le titre de l'onglet (« Nom sur X : "texte"
// / X »), et le nom d'un profil (« Nom (@compte) / X ») : l'onglet,
// l'historique et les lecteurs d'écran le montrent. Il est noté comme un tweet.
let xTitle = "";
let shownTitle = "";

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
 * Verdict qui a fait masquer chaque élément (texte, nom d'affichage, tweet cité ou carte).
 * @type {WeakMap<HTMLElement, Verdict>}
 */
const applied = new WeakMap();
/**
 * Compte en cause de chaque élément masqué, par clé : son auteur, ou le compte
 * dont le nom a suffi. Une fois ce compte autorisé, plus rien n'est gardé masqué.
 * @type {Map<string, string | null>}
 */
const culprits = new Map();
/**
 * Clés déjà comptées dans les statistiques pendant la session. Rien n'est
 * gardé d'une page à l'autre : un même message revu après un rechargement, ou
 * dans un autre onglet, est compté de nouveau.
 * @type {Set<string>}
 */
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
 * Compte de l'utilisateur, ou compte autorisé : ni ses posts ni son nom ne
 * sont masqués.
 * @param {string | null | undefined} handle
 */
const isExempt = (handle) => isOwnHandle(handle) || (!!handle && allowed.has(handle.toLowerCase()));

/**
 * Découpe un texte en tranches d'au plus MAX_TEXT_LENGTH caractères, coupées
 * sur un blanc : un mot n'est jamais coupé en deux, sans quoi « Pakistan »
 * deviendrait « Paki ».
 * @param {string} text
 * @returns {string[]}
 */
function slices(text) {
  /** @type {string[]} */
  const parts = [];
  let start = 0;
  while (text.length - start > MAX_TEXT_LENGTH) {
    // Sur le dernier blanc de la tranche ; sans blanc, au caractère près.
    let end = start + MAX_TEXT_LENGTH;
    while (end > start + OVERLAP && !/\s/.test(text[end])) end--;
    if (end === start + OVERLAP) end = start + MAX_TEXT_LENGTH;
    parts.push(text.slice(start, end));
    // La suivante reprend OVERLAP caractères plus tôt, au début d'un mot.
    start = end - OVERLAP;
    while (start < end && !/\s/.test(text[start - 1])) start++;
  }
  parts.push(text.slice(start));
  return parts;
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
  const { sensitivity, categories, customTerms, mutedRules } = settings;
  // Un texte long est masqué dès qu'une tranche l'est, avec le motif de la plus haineuse.
  const masking = slices(text)
    .map((slice) => scoreText({ text: slice, sensitivity, categories, customTerms, mutedRules, scope }))
    .filter((result) => result.match)
    .sort((a, b) => b.score - a.score);
  /** @type {Verdict} */
  const verdict = {
    text,
    version: settingsVersion,
    category: masking[0]?.categories[0] ?? null,
    ruleIds: [...new Set(masking.flatMap((result) => result.matches.map((m) => m.id)))],
  };
  verdicts.set(source, verdict);
  return verdict;
}

/**
 * Premier nom haineux parmi ceux qu'un élément affiche : un nom suffit à le
 * masquer, et c'est son compte qu'on propose d'autoriser. Les noms de
 * l'utilisateur et des comptes autorisés ne sont pas notés.
 * @param {(DisplayName | null)[]} names
 * @returns {{ verdict: Verdict, culprit: string | null } | null}
 */
function judgeNames(names) {
  for (const found of names) {
    if (!found || isExempt(found.handle)) continue;
    const verdict = judge(found.source, found.name, "name");
    if (verdict.category) return { verdict, culprit: found.handle };
  }
  return null;
}

/**
 * Masque ou démasque un élément selon son verdict.
 * @param {HTMLElement} el
 * @param {string} key
 * @param {Verdict | null} verdict null : rien à masquer
 * @param {string | null} culprit compte à proposer d'autoriser
 * @param {boolean} [post] post ou tweet cité : barre d'actions même s'il est petit
 */
function apply(el, key, verdict, culprit, post = false) {
  if (verdict?.category) {
    applied.set(el, verdict);
    culprits.set(key, culprit);
    if (!counted.has(key)) {
      counted.add(key);
      recordHidden(verdict.category);
    }
    treat(el, key, { reason: categoryLabel(verdict.category), author: culprit, post });
  } else if (isHiddenKey(key) && !isExempt(culprits.get(key))) {
    // Déjà masqué dans la session : on le garde masqué même si X l'a recréé
    // avec un texte légèrement différent (compteurs, traduction…), tant que
    // le compte en cause n'est pas autorisé.
    treat(el, key, { reason: "", author: culprit, post });
  } else {
    // Rien à masquer, ou le compte en cause vient d'être autorisé : l'élément
    // n'est plus compté.
    releaseHidden(key);
    untreat(el);
  }
}

/**
 * Le tweet cité est noté à part, pour son propre auteur : si seul lui est
 * haineux, seul lui est flouté, et le post de l'utilisateur ou d'un compte
 * autorisé ne l'est jamais, même cité par un autre. Sous un tweet masqué, il
 * n'a pas de voile à lui et ne compte pas parmi les éléments masqués.
 * @param {HTMLElement} unit
 * @param {HTMLElement} quote
 * @param {string} key
 */
function processQuote(unit, quote, key) {
  const author = extractAuthor(quote);
  if (isExempt(author)) {
    forgetKey(key);
    untreat(quote);
  } else if (isHidden(unit)) {
    releaseHidden(key);
    untreat(quote);
  } else {
    const text = extractQuoteText(quote);
    const verdict = text ? judge(quote, text) : null;
    const byName = verdict?.category ? null : judgeNames([extractDisplayName(quote)]);
    apply(quote, key, byName?.verdict ?? verdict, author, true);
  }
}

/**
 * La carte d'un lien est notée à part, comme le tweet cité : son titre vient
 * de la page liée, et elle n'a pas de compte à proposer d'autoriser.
 * @param {HTMLElement} unit
 * @param {HTMLElement} card
 * @param {string} key
 */
function processCard(unit, card, key) {
  if (isHidden(unit)) {
    releaseHidden(key);
    untreat(card);
  } else {
    const text = extractCardText(card);
    apply(card, key, text ? judge(card, text) : null, null);
  }
}

/** @param {HTMLElement} unit */
function processUnit(unit) {
  const key = unitKey(unit);
  const kind = unitKind(unit);
  if (kind === "notification" && isAboutOwnPost(unit)) {
    // Elle reprend un post de l'utilisateur, qui n'est pas noté : seuls les
    // noms des comptes qu'elle montre le sont.
    const byName = judgeNames(extractNames(unit));
    if (byName) {
      apply(unit, key, byName.verdict, byName.culprit);
    } else {
      forgetKey(key);
      untreat(unit);
    }
    return;
  }
  const author = extractAuthor(unit);
  if (isExempt(author)) {
    forgetKey(key);
    untreat(unit);
  } else {
    const text = extractText(unit);
    const verdict = text ? judge(unit, text) : null;
    // Un nom haineux suffit à masquer le tweet : celui de son auteur, ou celui
    // du compte qui l'a reposté.
    const byName =
      kind === "tweet" && !verdict?.category
        ? judgeNames([extractDisplayName(unit), extractSocialContext(unit)])
        : null;
    apply(unit, key, byName?.verdict ?? verdict, byName?.culprit ?? author, kind === "tweet");
  }
  if (kind !== "tweet") return;
  const quote = findQuote(unit);
  if (quote) processQuote(unit, quote, `quote:${key}`);
  const card = findCard(unit, quote);
  if (card) processCard(unit, card, `card:${key}`);
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

/**
 * Remplace le titre de l'onglet tant qu'il est haineux, et rend celui de X
 * dès qu'il ne l'est plus ou que Voyou est coupé.
 */
function guardTitle() {
  // Un titre autre que celui affiché par Voyou vient de X.
  if (document.title !== shownTitle) xTitle = document.title;
  // Comme dans la page, rien de l'utilisateur ni d'un compte autorisé n'est masqué.
  const exempt = isExempt(handleFromHref(location.pathname));
  const verdict = settings.enabled && xTitle && !exempt ? judge(document.documentElement, xTitle) : null;
  shownTitle = verdict?.category ? `${t("hiddenTitle")} / X` : xTitle;
  if (document.title !== shownTitle) document.title = shownTitle;
}

function scan() {
  syncTheme();
  guardTitle();
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
 * tweet vient d'être affiché ou masqué. Et le titre, quand X le réécrit.
 * @param {MutationRecord[]} mutations
 */
function onMutations(mutations) {
  if (!settings.enabled) return;
  // X a changé de page sans recharger : tout est renoté avec la nouvelle adresse.
  if (location.pathname !== scannedPath) {
    scan();
    return;
  }
  if (mutations.some((mutation) => document.head?.contains(mutation.target))) guardTitle();
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
