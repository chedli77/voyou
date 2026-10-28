/**
 * Repère le compte connecté pour ne jamais masquer ses propres posts, ni les
 * notifications qui citent ses posts (likes, réponses, citations).
 *
 * Les comptes détectés sont gardés dans chrome.storage.local (clé ownHandles)
 * pour être connus dès le chargement suivant, avant que X n'affiche son menu.
 */
import { NOTIFICATION, cleanHandle, handleFromHref } from "./x-dom.js";

const STORAGE_KEY = "ownHandles";
const REFRESH_MS = 5000;
const SWITCHER = '[data-testid="SideNav_AccountSwitcher_Button"]';
const NAV = 'nav, header[role="banner"]';
const ACCOUNT_AREAS = `${SWITCHER}, ${NAV}`;
// Lien « Profil » du menu : avec data-testid sur l'ancien X, avec seulement un aria-label sur x-web.
const PROFILE_LINK = `a[data-testid="AppTabBar_Profile_Link"], :is(${NAV}) a[aria-label="Profil" i], :is(${NAV}) a[aria-label="Profile" i]`;

// Texte des notifications qui parlent d'un post de l'utilisateur.
const OWN_NOTIFICATION_TEXT =
  /ont aimé votre post|a répondu à votre|a cité votre|votre post|votre réponse|reposted your|liked your/i;

/** @type {Set<string>} comptes de l'utilisateur, en minuscules */
let ownHandles = new Set();

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
 * @returns {string | null}
 */
function detectLoggedInHandle() {
  const profileLink = document.querySelector(PROFILE_LINK);
  const fromProfileLink = handleFromHref(profileLink?.getAttribute("href") ?? null);
  if (fromProfileLink) return fromProfileLink;

  const switcher = document.querySelector(SWITCHER);
  if (switcher) {
    const label = `${switcher.textContent ?? ""} ${switcher.getAttribute("aria-label") ?? ""}`;
    const fromLabel = cleanHandle(label.match(/@(\w{1,15})/)?.[1]);
    if (fromLabel) return fromLabel;
  }

  for (const nav of document.querySelectorAll(NAV)) {
    for (const a of nav.querySelectorAll('a[href^="/"]')) {
      const handle = handleFromHref(a.getAttribute("href"), true);
      if (handle) return handle;
    }
  }

  for (const avatar of document.querySelectorAll('[data-testid^="UserAvatar-Container-"]')) {
    if (!avatar.closest(ACCOUNT_AREAS)) continue;
    const handle = cleanHandle(avatar.getAttribute("data-testid")?.slice("UserAvatar-Container-".length));
    if (handle) return handle;
  }
  return null;
}

/**
 * Fusionne le compte détecté avec ceux déjà connus, et n'écrit dans le
 * stockage que si la liste a changé.
 * @returns {Promise<boolean>} vrai si la liste a changé
 */
async function refreshOwnHandles() {
  const stored = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
  const known = Array.isArray(stored) ? stored : [];
  const handles = mergeHandles([...known, detectLoggedInHandle()]);
  const before = [...ownHandles].sort().join();
  setOwnHandles(handles);
  if (handles.join() !== known.join()) await chrome.storage.local.set({ [STORAGE_KEY]: handles });
  return [...ownHandles].sort().join() !== before;
}

/**
 * Charge les comptes connus puis surveille le compte connecté : X affiche son
 * menu après le chargement et on peut changer de compte sans recharger.
 * @param {() => void} onChange appelé quand la liste des comptes change
 */
export async function initOwnHandles(onChange) {
  await refreshOwnHandles();
  const tick = () => refreshOwnHandles().then((changed) => changed && onChange());
  setTimeout(tick, 400);
  setTimeout(tick, 1500);
  setInterval(tick, REFRESH_MS);
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
  const clean = cleanHandle(handle);
  return !!clean && ownHandles.has(clean.toLowerCase());
}

/**
 * Vrai pour un post de l'utilisateur, ou pour une notification qui parle de
 * l'un de ses posts : elle reprend son texte, qui ne doit pas être noté.
 * @param {Element} unit
 * @param {string | null} author
 */
export function isOwnContent(unit, author) {
  if (isOwnHandle(author)) return true;
  const inNotification = !!unit.closest(NOTIFICATION);
  // Une réponse normale qui dit « votre post » doit quand même être analysée :
  // ce texte ne compte que dans une notification ou sur la page des notifications.
  const onNotificationsPage = location.pathname.startsWith("/notifications");
  if ((inNotification || onNotificationsPage) && OWN_NOTIFICATION_TEXT.test(unit.textContent ?? "")) return true;
  if (!inNotification) return false;
  for (const a of unit.querySelectorAll('a[href*="/status/"]')) {
    if (isOwnHandle(a.getAttribute("href")?.match(/^\/(\w{1,15})\/status\//)?.[1])) return true;
  }
  return false;
}
