/**
 * Repère le compte connecté pour ne jamais masquer ses propres posts, ni le
 * texte des notifications qui reprennent ses posts (likes, reposts).
 *
 * Les comptes détectés sont gardés dans chrome.storage.local (clé ownHandles)
 * pour être connus dès le chargement suivant, avant que X n'affiche son menu.
 * Un compte seulement deviné dans les liens du menu n'y est pas écrit : une
 * erreur ne dure que le temps de l'onglet.
 */
import { every, guard } from "../lifecycle.js";
import { cleanHandle, handleFromHref } from "./x-dom.js";

const STORAGE_KEY = "ownHandles";
const REFRESH_MS = 5000;
const SWITCHER = '[data-testid="SideNav_AccountSwitcher_Button"]';
const NAV = 'nav, header[role="banner"]';
const ACCOUNT_AREAS = `${SWITCHER}, ${NAV}`;
// Lien « Profil » du menu : avec data-testid sur l'ancien X, avec seulement
// un aria-label, dans la langue de X, sur x-web.
const PROFILE_LABELS = ["Profil", "Profile", "Perfil", "Profilo"];
const PROFILE_LINK = [
  'a[data-testid="AppTabBar_Profile_Link"]',
  ...PROFILE_LABELS.map((label) => `:is(${NAV}) a[aria-label="${label}" i]`),
].join(", ");

// Formules des notifications qui parlent d'un post de l'utilisateur, en
// français et en anglais : « a aimé votre post », « liked 2 of your posts ».
const OWN_POST_NOTIFICATION =
  /(?:a|ont) (?:aimé|reposté|retweeté|cité|répondu à) (?:votre|vos|\d+ de vos)|(?:liked|reposted|retweeted|quoted|replied to) (?:your|\d+ of your)/i;

/** @type {Set<string>} comptes de l'utilisateur, en minuscules */
let ownHandles = new Set();
/** @type {string | null} compte deviné dans le menu, en minuscules, gardé pour l'onglet seulement */
let guessedHandle = null;

/**
 * @param {(string | null | undefined)[]} candidates
 * @returns {string[]} comptes valides, sans doublon
 */
function mergeHandles(candidates) {
  /** @type {Map<string, string>} */
  const byLower = new Map();
  for (const candidate of candidates) {
    const handle = cleanHandle(candidate);
    if (handle && !byLower.has(handle.toLowerCase())) byLower.set(handle.toLowerCase(), handle);
  }
  return [...byLower.values()];
}

/** @param {string[]} handles */
function setOwnHandles(handles) {
  ownHandles = new Set(mergeHandles(handles).map((h) => h.toLowerCase()));
}

/**
 * Lit le compte connecté dans le menu de X. Plusieurs sources, de la plus
 * fiable à la moins fiable, car X change souvent ces éléments.
 * @returns {{ handle: string, sure: boolean } | null}
 */
function detectLoggedInHandle() {
  const profileLink = document.querySelector(PROFILE_LINK);
  const fromProfileLink = handleFromHref(profileLink?.getAttribute("href") ?? null);
  if (fromProfileLink) return { handle: fromProfileLink, sure: true };

  const switcher = document.querySelector(SWITCHER);
  if (switcher) {
    const label = `${switcher.textContent ?? ""} ${switcher.getAttribute("aria-label") ?? ""}`;
    const fromLabel = cleanHandle(label.match(/@(\w{1,15})/)?.[1]);
    if (fromLabel) return { handle: fromLabel, sure: true };
  }

  for (const avatar of document.querySelectorAll('[data-testid^="UserAvatar-Container-"]')) {
    if (!avatar.closest(ACCOUNT_AREAS) || avatar.closest("main")) continue;
    const handle = cleanHandle(avatar.getAttribute("data-testid")?.slice("UserAvatar-Container-".length));
    if (handle) return { handle, sure: true };
  }

  // Faute de mieux, le menu principal : le nav qui mène à l'accueil, hors de
  // la colonne principale, où un profil visité a ses onglets (Posts,
  // Réponses…) qui pointent vers lui. Le lien du profil y est le dernier qui
  // mène à un compte : avant lui viennent des pages comme /jobs.
  const menu = [...document.querySelectorAll("nav")].find(
    (nav) => !nav.closest("main") && nav.querySelector('a[href="/home"]'),
  );
  const guess = [...(menu?.querySelectorAll('a[href^="/"]') ?? [])]
    .map((a) => handleFromHref(a.getAttribute("href"), true))
    .filter((handle) => handle !== null)
    .at(-1);
  return guess ? { handle: guess, sure: false } : null;
}

/**
 * Ajoute le compte connecté à ceux déjà connus. Le stockage n'est lu puis
 * écrit que pour un compte nouveau et sûr : les autres onglets tiennent la
 * liste à jour par applyStoredHandles.
 * @returns {Promise<boolean>} vrai si la liste a changé
 */
async function refreshOwnHandles() {
  const found = detectLoggedInHandle();
  if (!found || ownHandles.has(found.handle.toLowerCase())) return false;
  if (!found.sure) {
    const changed = guessedHandle !== found.handle.toLowerCase();
    guessedHandle = found.handle.toLowerCase();
    return changed;
  }
  const stored = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
  const handles = mergeHandles([...(Array.isArray(stored) ? stored : []), found.handle]);
  setOwnHandles(handles);
  await chrome.storage.local.set({ [STORAGE_KEY]: handles });
  return true;
}

/**
 * Charge les comptes connus puis surveille le compte connecté : X affiche son
 * menu après le chargement et on peut changer de compte sans recharger.
 * @param {() => void} onChange appelé quand la liste des comptes change
 */
export async function initOwnHandles(onChange) {
  applyStoredHandles((await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY]);
  await refreshOwnHandles();
  const tick = () => guard() && refreshOwnHandles().then((changed) => changed && onChange());
  setTimeout(tick, 400);
  setTimeout(tick, 1500);
  every(REFRESH_MS, tick);
}

/**
 * Met à jour la liste quand un autre onglet l'a modifiée.
 * @param {unknown} handles nouvelle valeur de ownHandles dans le stockage
 */
export function applyStoredHandles(handles) {
  setOwnHandles(Array.isArray(handles) ? handles : []);
}

/** @param {string | null | undefined} handle */
export function isOwnHandle(handle) {
  const clean = cleanHandle(handle)?.toLowerCase();
  return !!clean && (ownHandles.has(clean) || clean === guessedHandle);
}

/**
 * Vrai pour une notification qui parle d'un post de l'utilisateur (like,
 * repost) : elle reprend son texte, qui ne doit pas être noté. Une réponse,
 * une mention ou une citation n'en est jamais une : c'est un post, noté quoi
 * qu'il dise, dans n'importe quelle langue.
 * @param {Element} notification unité de type notification
 */
export function isAboutOwnPost(notification) {
  for (const a of notification.querySelectorAll('a[href*="/status/"]')) {
    if (isOwnHandle(a.getAttribute("href")?.match(/^\/(\w{1,15})\/status\//)?.[1])) return true;
  }
  return OWN_POST_NOTIFICATION.test(notification.textContent ?? "");
}
