/**
 * Tout ce que Voyou sait du DOM de X est ici, pour pouvoir le corriger vite
 * quand X change son interface.
 *
 * X sert deux versions de son site : l'ancienne, avec des attributs
 * data-testid, et le nouveau client « x-web », sans data-testid, où le texte
 * est dans des div[dir=auto]. Les cartes de compte, les bios, les sondages,
 * les cartes de lien et la ligne « a reposté » ne sont reconnus que sur
 * l'ancienne version.
 */

const XWEB_ARTICLE = "article:not([data-testid])";
export const TWEET = `article[data-testid="tweet"], ${XWEB_ARTICLE}`;
export const NOTIFICATION = '[data-testid="notification"]';
const TWEET_TEXT = '[data-testid="tweetText"]';
// Options d'un sondage : écrites par l'auteur, elles sont lues avec son texte.
const POLL = '[data-testid="cardPoll"]';
const AUTHORED = `${TWEET_TEXT}, ${POLL}`;
// Carte d'un lien : titre et description de la page liée. Un sondage est aussi dans une carte.
const CARD = '[data-testid="card.wrapper"]';
// Ligne au-dessus d'un tweet : « Nom a reposté ».
const SOCIAL_CONTEXT = '[data-testid="socialContext"]';
const XWEB_TEXT = 'div[dir="auto"]';
const USER_NAME = '[data-testid="User-Name"]';
// Carte de compte : suggestions, abonnés, likes, recherche. Contient nom et bio.
const USER_CELL = '[data-testid="UserCell"]';
// En-tête d'un profil, sur sa page ou dans une carte de survol.
const PROFILE_BIO = '[data-testid="UserDescription"]';
const PROFILE_NAME = '[data-testid="UserName"]';
const PROFILE_SCOPE = '[data-testid="primaryColumn"], [data-testid="HoverCard"]';
const UNIT_SELECTOR = [TWEET, NOTIFICATION, USER_CELL, PROFILE_BIO, PROFILE_NAME].join(", ");
const NOTIFICATIONS_PAGE = /^\/notifications(?:\/|$)/;

/** @typedef {"tweet" | "notification" | "user" | "bio" | "profile-name"} UnitKind */

/**
 * @typedef {object} DisplayName
 * @property {string} name nom d'affichage : « Jean Dupont » pour le compte jdupont
 * @property {string | null} handle compte à qui il est
 * @property {Element} source élément d'où il est lu, clé du cache des verdicts
 */

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
 * L'interface ajoutée par Voyou est ignorée, comme les sous-arbres de skip.
 * @param {Node} node
 * @param {readonly (Element | null)[]} skip
 * @returns {string}
 */
function readText(node, skip) {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue ?? "";
  if (!(node instanceof Element) || node.matches(".voyou-overlay, .voyou-rehide") || skip.includes(node)) return "";
  if (node.tagName === "IMG") return node.getAttribute("alt") ?? "";
  let text = "";
  for (const child of node.childNodes) text += readText(child, skip);
  return BLOCK_TAGS.has(node.tagName) ? `${text}\n` : text;
}

/**
 * @param {Element} el
 * @param {readonly (Element | null)[]} [skip] sous-arbres à ne pas lire
 */
const textOf = (el, skip = []) =>
  readText(el, skip)
    .replace(/\n{2,}/g, "\n")
    .trim();

/**
 * Compte écrit dans un bloc nom (« Nom @compte · 1 h ») : le dernier @, car
 * un nom d'affichage peut en contenir un.
 * @param {Element | null | undefined} block
 */
const handleInText = (block) => cleanHandle(block ? [...textOf(block).matchAll(/@(\w{1,15})/g)].at(-1)?.[1] : null);

/**
 * Tweet cité dans un tweet : un bloc cliquable (ancien X), retrouvé par son
 * texte ou son sondage, ou un <article> imbriqué (x-web). Il est noté à part,
 * pour ne flouter que lui.
 * @param {Element} unit
 * @returns {HTMLElement | null}
 */
export function findQuote(unit) {
  for (const text of unit.querySelectorAll(AUTHORED)) {
    const box = text.closest('div[role="link"]');
    if (box instanceof HTMLElement && box !== unit && unit.contains(box)) return box;
  }
  const nested = unit.querySelector("article");
  return nested instanceof HTMLElement ? nested : null;
}

/**
 * Carte d'un lien dans un tweet, hors tweet cité. Son texte vient de la page
 * liée, pas de l'auteur : elle est notée à part, comme le tweet cité.
 * @param {Element} unit
 * @param {Element | null} quote
 * @returns {HTMLElement | null}
 */
export function findCard(unit, quote) {
  for (const card of unit.querySelectorAll(CARD)) {
    if (card instanceof HTMLElement && !quote?.contains(card) && !card.querySelector(POLL)) return card;
  }
  return null;
}

/**
 * Id du post sur le lien de son heure : le premier lien de statut hors du
 * tweet cité, qui a les siens. Le tweet ouvert sur x-web n'en a pas.
 * @param {Element} unit
 */
function selfStatusId(unit) {
  const quote = findQuote(unit);
  for (const a of unit.querySelectorAll('a[href*="/status/"]')) {
    if (quote?.contains(a)) continue;
    const id = a.getAttribute("href")?.match(/\/status\/(\d+)/)?.[1];
    if (id) return id;
  }
  return null;
}

/**
 * Texte d'un tweet ou d'une notification, sondage compris, sans le tweet cité
 * ni la carte de lien, notés à part.
 * @param {Element} unit
 * @returns {string}
 */
export function extractText(unit) {
  const tweet = unit.matches(TWEET);
  const quote = tweet ? findQuote(unit) : null;
  const parts = [...unit.querySelectorAll(AUTHORED)]
    .filter((n) => !quote?.contains(n))
    .map((n) => textOf(n))
    .filter(Boolean);
  if (parts.length) return parts.join("\n");

  if (unit.matches(XWEB_ARTICLE)) {
    // Client x-web : on prend les div[dir=auto] de premier niveau, hors liens
    // et hors tweets cités (qui sont des <article> imbriqués).
    const isNested = (/** @type {Element} */ n) => {
      const outer = n.parentElement?.closest(XWEB_TEXT);
      return !!outer && unit.contains(outer);
    };
    const xweb = [...unit.querySelectorAll(XWEB_TEXT)]
      .filter((n) => !n.closest("a") && !isNested(n) && n.closest("article") === unit)
      .map((n) => textOf(n))
      .filter(Boolean);
    if (xweb.length) return xweb.join("\n");
  }

  // Sans texte propre (photo seule, lien seul), le reste de l'unité. Pour un
  // tweet, hors de ce qui est noté à part : tweet cité, carte, nom de l'auteur
  // et du compte qui l'a reposté.
  const skip = tweet
    ? [quote, findCard(unit, quote), unit.querySelector(USER_NAME), unit.querySelector(SOCIAL_CONTEXT)]
    : [];
  return textOf(unit, skip);
}

/**
 * Texte du tweet cité, sondage compris.
 * @param {Element} quote
 */
export function extractQuoteText(quote) {
  const parts = [...quote.querySelectorAll(AUTHORED)].map((n) => textOf(n)).filter(Boolean);
  if (parts.length) return parts.join("\n");
  return [...quote.querySelectorAll(XWEB_TEXT)]
    .filter((n) => !n.closest("a"))
    .map((n) => textOf(n))
    .filter(Boolean)
    .join("\n");
}

/** @param {Element} card */
export const extractCardText = (card) => textOf(card);

/**
 * Noms d'affichage lus dans les liens de profil de scope : ceux des comptes
 * qu'une notification montre (« Nom a aimé votre post »), ou celui de
 * l'auteur dans son bloc nom.
 * @param {Element} scope
 * @returns {DisplayName[]}
 */
export function extractNames(scope) {
  return [...scope.querySelectorAll('a[href^="/"]')].flatMap((a) => {
    const handle = handleFromHref(a.getAttribute("href"), true);
    const name = handle ? textOf(a) : "";
    return name && !name.startsWith("@") ? [{ name, handle, source: a }] : [];
  });
}

/**
 * Nom d'affichage de l'auteur d'un tweet ou d'un tweet cité.
 * @param {Element} el
 * @returns {DisplayName | null}
 */
export function extractDisplayName(el) {
  const block = el.querySelector(USER_NAME);
  const [first] = extractNames(block ?? el);
  if (first) return first;
  // Sur l'ancien X, le bloc nom d'un tweet cité n'a pas de lien : le nom en est le premier morceau.
  const source = block?.firstElementChild;
  const name = source ? textOf(source) : "";
  return source && name && !name.startsWith("@") ? { name, handle: handleInText(block), source } : null;
}

/**
 * Ligne au-dessus d'un tweet, avec le compte qu'elle nomme (« Nom a reposté »).
 * Elle est lue entière : la formule ne compte pour rien.
 * @param {Element} unit
 * @returns {DisplayName | null}
 */
export function extractSocialContext(unit) {
  const source = unit.querySelector(SOCIAL_CONTEXT);
  const name = source ? textOf(source) : "";
  if (!source || !name) return null;
  return { name, handle: handleFromHref(source.closest("a")?.getAttribute("href") ?? null), source };
}

/**
 * Sur x-web, rien ne marque une notification (like, repost, abonnement) :
 * c'est un article de la page des notifications sans lien vers lui-même.
 * Une réponse ou une mention, elle, est un post, avec son heure en lien.
 * @param {Element} el
 */
const isXwebNotification = (el) =>
  el.matches(XWEB_ARTICLE) && NOTIFICATIONS_PAGE.test(location.pathname) && !selfStatusId(el);

/**
 * @param {Element} el
 * @returns {UnitKind}
 */
export function unitKind(el) {
  if (el.matches(NOTIFICATION) || isXwebNotification(el)) return "notification";
  if (el.matches(TWEET)) return "tweet";
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
 * Auteur d'un tweet : le bloc nom (ses liens, sinon son texte), à défaut le
 * premier lien de profil. Pour une bio ou un nom de profil, le @compte de
 * l'en-tête : X change d'adresse avant de rendre le nouvel en-tête,
 * l'adresse ne sert qu'à défaut.
 * @param {Element} unit
 * @returns {string | null}
 */
export function extractAuthor(unit) {
  if (unit.matches(PROFILE_NAME)) return handleInText(unit) ?? profileHandle();
  if (unit.matches(PROFILE_BIO)) {
    return handleInText(unit.closest(PROFILE_SCOPE)?.querySelector(PROFILE_NAME)) ?? profileHandle();
  }
  const block = unit.querySelector(USER_NAME);
  for (const a of (block ?? unit).querySelectorAll('a[href^="/"]')) {
    const handle = handleFromHref(a.getAttribute("href"));
    if (handle) return handle;
  }
  // Bloc nom sans lien (tweet cité de l'ancien X) : jamais un lien du texte,
  // qui peut mentionner n'importe qui.
  return handleInText(block);
}

/**
 * Clé qui identifie un élément pendant la session, pour qu'il reste masqué
 * ou révélé quand X le détruit puis le recrée au scroll. Pour un tweet, l'id
 * du statut, qui est stable ; à défaut, et pour le reste, le compte et le
 * début du texte. Une carte de compte a son lien de profil.
 * @param {Element} unit
 */
export function unitKey(unit) {
  const kind = unitKind(unit);
  const author = extractAuthor(unit);
  if (kind === "user" && author) return `user:${author}`;
  const id = kind === "tweet" ? selfStatusId(unit) : null;
  return id ? `status:${id}` : `${kind}:${author ?? "?"}:${extractText(unit).slice(0, 80)}`;
}

/**
 * Ce que Voyou note : un tweet de premier niveau (le tweet cité est géré avec
 * lui), même rendu dans une notification, une notification sans tweet, une
 * carte de compte hors tweet, la bio et le nom d'une page de profil.
 * @param {Element} el
 */
export function isUnit(el) {
  if (el.matches(TWEET)) return !el.parentElement?.closest(TWEET);
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
