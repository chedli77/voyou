/**
 * Quand l'extension est rechargée ou mise à jour, Chrome laisse tourner
 * l'ancien script dans les onglets déjà ouverts, mais coupé de l'extension :
 * chaque appel à chrome.* lève « Extension context invalidated ». Ce module
 * le détecte et arrête proprement les tâches de cet ancien script. L'onglet
 * rechargé repart avec la nouvelle version.
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
 * tout, si l'extension a été rechargée entre-temps.
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
