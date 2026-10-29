/**
 * Quand l'extension est rechargée ou mise à jour, Chrome laisse tourner
 * l'ancien script dans les onglets déjà ouverts, mais coupé de l'extension :
 * chaque appel à chrome.* lève « Extension context invalidated ». Ce module
 * le détecte et arrête les tâches qui touchent chrome.* (réglages, comptes,
 * statistiques, module flottant). Le floutage, qui n'en a pas besoin, continue
 * avec les derniers réglages jusqu'au rechargement de l'onglet, qui repart avec
 * la nouvelle version. Une désactivation ou une désinstallation coupe le
 * script de la même façon : il ne peut pas les distinguer d'une mise à jour.
 *
 * Firefox, lui, détruit l'ancien script sans rien lui laisser exécuter, retire
 * content.css de la page et laisse le DOM tel quel : les attributs data-voyou-*
 * et inert restent sur les éléments de X jusqu'au rechargement. À la
 * mise à jour ou à la réactivation, il injecte la nouvelle version dans les
 * onglets ouverts, qui reprend ce que l'ancienne a laissé (voir initHud et start).
 */

/** @type {Set<() => void>} */
const stops = new Set();

/** Vrai tant que le script est encore relié à l'extension. */
export function isAlive() {
  try {
    return Boolean(chrome.runtime?.id);
  } catch {
    return false;
  }
}

/** @param {() => void} stop à appeler quand le script est coupé de l'extension */
export function onShutdown(stop) {
  stops.add(stop);
}

/**
 * À appeler avant tout travail qui touche chrome.* : renvoie faux, et arrête
 * ces tâches, si l'extension a été rechargée entre-temps.
 */
export function guard() {
  if (isAlive()) return true;
  for (const stop of stops) stop();
  stops.clear();
  return false;
}

/**
 * Comme setInterval, mais s'arrête de lui-même quand le script est coupé.
 * @param {number} ms
 * @param {() => void} task
 */
export function every(ms, task) {
  const id = window.setInterval(() => guard() && task(), ms);
  onShutdown(() => window.clearInterval(id));
}
