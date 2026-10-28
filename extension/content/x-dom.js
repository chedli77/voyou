/**
 * Tout ce que Voyou sait du DOM de X est ici, pour pouvoir le corriger vite
 * quand X change son interface.
 *
 * X sert deux versions de son site : l'ancienne, avec des attributs
 * data-testid, et le nouveau client « x-web », sans data-testid, où le texte
 * est dans des div[dir=auto].
 */

export const TWEET = 'article[data-testid="tweet"], article:not([data-testid])';
export const NOTIFICATION = '[data-testid="notification"]';
const TWEET_TEXT = '[data-testid="tweetText"]';
const XWEB_TEXT = 'div[dir="auto"]';
const USER_NAME = '[data-testid="User-Name"]';
const OBSERVER_ROOTS = ['[data-testid="primaryColumn"]', 'main[role="main"]', "main", "#react-root"];

// Chemins d'URL de X qui ressemblent à un profil mais n'en sont pas.
const RESERVED_PATHS = new Set([
  "home",
  "explore",
  "search",
  "i",
  "settings",
  "messages",
  "notifications",
  "compose",
  "login",
  "signup",
  "tos",
  "privacy",
  "intent",
  "hashtag",
  "share",
]);

/**
 * Valide un nom de compte X (1 à 15 caractères, lettres, chiffres, _).
 * @param {string | null | undefined} value avec ou sans @
 * @returns {string | null}
 */
export function cleanHandle(value) {
  const handle = value?.trim().replace(/^@/, "") ?? "";
  if (!/^\w{1,15}$/.test(handle) || RESERVED_PATHS.has(handle.toLowerCase())) return null;
  return handle;
}

/**
 * "/moncompte/status/123" donne "moncompte".
 * @param {string | null} href
 * @param {boolean} [profileOnly] n'accepter que "/compte", sans rien derrière
 */
export function handleFromHref(href, profileOnly = false) {
  const m = href?.match(profileOnly ? /^\/(\w{1,15})\/?$/ : /^\/(\w{1,15})(?:[/?]|$)/);
  return m ? cleanHandle(m[1]) : null;
}

const BLOCK_TAGS = new Set(["DIV", "P", "LI", "BR"]);

/**
 * Lit le texte d'un élément comme un humain le voit. X affiche les emojis en
 * images (<img alt="🐒">) : innerText les ignore, ici on garde leur alt.
 * L'interface ajoutée par Voyou est ignorée.
 * @param {Node} node
 * @returns {string}
 */
function readText(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue ?? "";
  if (!(node instanceof Element) || node.matches(".voyou-overlay, .voyou-rehide")) return "";
  if (node.tagName === "IMG") return node.getAttribute("alt") ?? "";
  let text = "";
  for (const child of node.childNodes) text += readText(child);
  return BLOCK_TAGS.has(node.tagName) ? `${text}\n` : text;
}

/** @param {Element} el */
const textOf = (el) =>
  readText(el)
    .replace(/\n{2,}/g, "\n")
    .trim();

/**
 * Texte d'un tweet ou d'une notification.
 * @param {Element} unit
 * @returns {string}
 */
export function extractText(unit) {
  const parts = [...unit.querySelectorAll(TWEET_TEXT)].map(textOf).filter(Boolean);
  if (parts.length) return parts.join("\n");

  if (unit.tagName === "ARTICLE" && !unit.hasAttribute("data-testid")) {
    // Client x-web : on prend les div[dir=auto] de premier niveau, hors liens
    // et hors tweets cités (qui sont des <article> imbriqués).
    const isNested = (/** @type {Element} */ n) => {
      const outer = n.parentElement?.closest(XWEB_TEXT);
      return !!outer && unit.contains(outer);
    };
    const xweb = [...unit.querySelectorAll(XWEB_TEXT)]
      .filter((n) => !n.closest("a") && !isNested(n) && n.closest("article") === unit)
      .map(textOf)
      .filter(Boolean);
    if (xweb.length) return xweb.join("\n");
  }

  return textOf(unit);
}

/**
 * Auteur d'un tweet : d'abord le bloc nom, sinon le premier lien de profil.
 * @param {Element} unit
 * @returns {string | null}
 */
export function extractAuthor(unit) {
  for (const scope of [unit.querySelector(USER_NAME), unit]) {
    if (!scope) continue;
    for (const a of scope.querySelectorAll('a[href^="/"]')) {
      const handle = handleFromHref(a.getAttribute("href"));
      if (handle) return handle;
    }
  }
  return null;
}

/**
 * Clé qui identifie un tweet pendant la session, pour qu'il reste masqué ou
 * révélé quand X le détruit puis le recrée au scroll. L'id du statut est
 * stable ; à défaut on combine l'auteur et le début du texte.
 * @param {Element} unit
 */
export function unitKey(unit) {
  for (const a of unit.querySelectorAll('a[href*="/status/"]')) {
    const id = a.getAttribute("href")?.match(/\/status\/(\d+)/)?.[1];
    if (id) return `status:${id}`;
  }
  const kind = unit.matches(NOTIFICATION) ? "notif" : "weak";
  return `${kind}:${extractAuthor(unit) ?? "?"}:${extractText(unit).slice(0, 80)}`;
}

/** Élément à observer : la colonne principale si elle existe déjà. */
export function findObserverRoot() {
  for (const selector of OBSERVER_ROOTS) {
    const el = document.querySelector(selector);
    if (el) return el;
  }
  return document.documentElement;
}

/**
 * Un tweet de premier niveau (pas un tweet cité), ou une notification qui ne
 * contient pas de tweet (sinon le tweet est traité, pas la notification).
 * @param {Element} el
 */
export function isUnit(el) {
  if (el.matches(TWEET)) return !el.parentElement?.closest("article");
  return el.matches(NOTIFICATION) && !el.querySelector(TWEET);
}

/**
 * Tous les tweets et notifications à analyser sous root, root compris.
 * @param {ParentNode} root
 * @returns {HTMLElement[]}
 */
export function findUnits(root) {
  /** @type {HTMLElement[]} */
  const units = [];
  if (root instanceof HTMLElement && isUnit(root)) units.push(root);
  for (const el of root.querySelectorAll(`${TWEET}, ${NOTIFICATION}`)) {
    if (el instanceof HTMLElement && isUnit(el)) units.push(el);
  }
  return units;
}
