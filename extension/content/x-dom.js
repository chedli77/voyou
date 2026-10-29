/**
 * Tout ce que Voyou sait du DOM de X est ici, pour pouvoir le corriger vite
 * quand X change son interface.
 *
 * X sert deux versions de son site : l'ancienne, avec des attributs
 * data-testid, et le nouveau client « x-web », sans data-testid, où le texte
 * est dans des div[dir=auto]. Les cartes de compte et les bios ne sont
 * reconnues que sur l'ancienne version.
 */

export const TWEET = 'article[data-testid="tweet"], article:not([data-testid])';
export const NOTIFICATION = '[data-testid="notification"]';
const TWEET_TEXT = '[data-testid="tweetText"]';
const XWEB_TEXT = 'div[dir="auto"]';
const USER_NAME = '[data-testid="User-Name"]';
// Carte de compte : suggestions, abonnés, likes, recherche. Contient nom et bio.
const USER_CELL = '[data-testid="UserCell"]';
// En-tête d'une page de profil.
const PROFILE_BIO = '[data-testid="UserDescription"]';
const PROFILE_NAME = '[data-testid="UserName"]';
const UNIT_SELECTOR = [TWEET, NOTIFICATION, USER_CELL, PROFILE_BIO, PROFILE_NAME].join(", ");

/** @typedef {"tweet" | "notification" | "user" | "bio" | "profile-name"} UnitKind */

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
 * Tweet cité dans un tweet : un bloc cliquable (ancien X) ou un <article>
 * imbriqué (x-web). Il est noté à part, pour ne flouter que lui.
 * @param {Element} unit
 * @returns {HTMLElement | null}
 */
export function findQuote(unit) {
  for (const text of unit.querySelectorAll(TWEET_TEXT)) {
    const box = text.closest('div[role="link"]');
    if (box instanceof HTMLElement && box !== unit && unit.contains(box)) return box;
  }
  const nested = unit.querySelector("article");
  return nested instanceof HTMLElement ? nested : null;
}

/**
 * Texte d'un tweet ou d'une notification, sans celui du tweet cité.
 * @param {Element} unit
 * @returns {string}
 */
export function extractText(unit) {
  const quote = unit.matches(TWEET) ? findQuote(unit) : null;
  const parts = [...unit.querySelectorAll(TWEET_TEXT)]
    .filter((n) => !quote?.contains(n))
    .map(textOf)
    .filter(Boolean);
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
 * Texte du tweet cité.
 * @param {Element} quote
 */
export function extractQuoteText(quote) {
  const parts = [...quote.querySelectorAll(TWEET_TEXT)].map(textOf).filter(Boolean);
  if (parts.length) return parts.join("\n");
  return [...quote.querySelectorAll(XWEB_TEXT)]
    .filter((n) => !n.closest("a"))
    .map(textOf)
    .filter(Boolean)
    .join("\n");
}

/**
 * Nom d'affichage de l'auteur (« Jean Dupont », pas « @jdupont »), avec le
 * lien d'où il est lu, qui sert de clé au cache des verdicts.
 * @param {Element} unit
 * @returns {{ name: string, source: Element } | null}
 */
export function extractDisplayName(unit) {
  const scope = unit.querySelector(USER_NAME) ?? unit;
  for (const a of scope.querySelectorAll('a[href^="/"]')) {
    if (!handleFromHref(a.getAttribute("href"))) continue;
    const name = textOf(a);
    if (name && !name.startsWith("@")) return { name, source: a };
  }
  return null;
}

/** @param {Element} el */
export function unitKind(el) {
  if (el.matches(TWEET)) return "tweet";
  if (el.matches(NOTIFICATION)) return "notification";
  if (el.matches(USER_CELL)) return "user";
  if (el.matches(PROFILE_BIO)) return "bio";
  return "profile-name";
}

/**
 * Compte affiché sur la page de profil courante ("/compte" ou "/compte/...").
 * @returns {string | null}
 */
const profileHandle = () => handleFromHref(location.pathname);

/**
 * Auteur d'un tweet : d'abord le bloc nom, sinon le premier lien de profil.
 * Pour une bio ou un nom de profil, le compte de la page.
 * @param {Element} unit
 * @returns {string | null}
 */
export function extractAuthor(unit) {
  if (unit.matches(`${PROFILE_BIO}, ${PROFILE_NAME}`)) return profileHandle();
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
  const kind = unitKind(unit);
  if (kind === "user" || kind === "bio" || kind === "profile-name") return `${kind}:${extractAuthor(unit) ?? "?"}`;
  for (const a of unit.querySelectorAll('a[href*="/status/"]')) {
    const id = a.getAttribute("href")?.match(/\/status\/(\d+)/)?.[1];
    if (id) return `status:${id}`;
  }
  return `${kind}:${extractAuthor(unit) ?? "?"}:${extractText(unit).slice(0, 80)}`;
}

/**
 * Ce que Voyou note : un tweet de premier niveau (le tweet cité est géré avec
 * lui), une notification sans tweet, une carte de compte hors tweet, la bio
 * et le nom d'une page de profil.
 * @param {Element} el
 */
export function isUnit(el) {
  if (el.matches(TWEET)) return !el.parentElement?.closest("article");
  if (el.matches(NOTIFICATION)) return !el.querySelector(TWEET);
  if (el.matches(USER_CELL)) return !el.closest("article");
  if (el.matches(PROFILE_BIO)) return !el.closest(USER_CELL);
  return el.matches(PROFILE_NAME);
}

/**
 * L'unité qui contient el (el compris), pour renoter un tweet quand X
 * modifie l'un de ses morceaux.
 * @param {Element} el
 * @returns {HTMLElement | null}
 */
export function unitOf(el) {
  let node = el.closest(UNIT_SELECTOR);
  while (node) {
    if (node instanceof HTMLElement && isUnit(node)) return node;
    node = node.parentElement?.closest(UNIT_SELECTOR) ?? null;
  }
  return null;
}

/**
 * Toutes les unités à analyser sous root, root compris.
 * @param {ParentNode} root
 * @returns {HTMLElement[]}
 */
export function findUnits(root) {
  /** @type {HTMLElement[]} */
  const units = [];
  if (root instanceof HTMLElement && isUnit(root)) units.push(root);
  for (const el of root.querySelectorAll(UNIT_SELECTOR)) {
    if (el instanceof HTMLElement && isUnit(el)) units.push(el);
  }
  return units;
}
