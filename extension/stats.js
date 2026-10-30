/**
 * Statistiques locales : combien de messages ont été masqués, par jour et par
 * catégorie. Aucun texte, aucun compte, aucun identifiant de tweet n'est
 * gardé, seulement des compteurs, et seulement sur les 30 derniers jours.
 */

import { guard } from "./lifecycle.js";

const STATS_KEY = "stats";
const KEEP_DAYS = 30;
const FLUSH_DELAY_MS = 2000;
// Chaque onglet X lit les compteurs puis les réécrit en entier. Ce verrou,
// partagé par les onglets d'une même origine, les fait passer un par un :
// sinon le dernier qui écrit efface ce que les autres viennent d'ajouter.
const LOCK_NAME = "voyou-stats";
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** @typedef {Record<string, Record<string, number>>} Stats jour (AAAA-MM-JJ) puis catégorie */

/** @param {Date} date */
export const dayKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/**
 * Le jour qui précède aujourd'hui de n jours (qui le suit si n est négatif).
 * On compte en jours de calendrier et pas en tranches de 24 h : un jour de
 * changement d'heure dure 23 ou 25 heures.
 * @param {number} n
 */
function dayKeyAgo(n) {
  const today = new Date();
  return dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - n));
}

/**
 * Les `days` derniers jours, aujourd'hui compris. Le lendemain passe aussi :
 * après un voyage vers l'ouest, la date du jour recule d'un jour.
 * @param {number} days
 * @returns {(day: string) => boolean}
 */
function lastDays(days) {
  const first = dayKeyAgo(days - 1);
  const last = dayKeyAgo(-1);
  return (day) => DAY_KEY.test(day) && day >= first && day <= last;
}

/** @type {Stats} */
let pending = {};
let flushTimer = 0;

/** @param {unknown} value */
const asStats = (value) => /** @type {Stats} */ (value && typeof value === "object" ? value : {});

/**
 * Retire ce qui sort des 30 derniers jours, et les clés qui ne sont pas des jours.
 * @param {Stats} stats
 * @returns {boolean} vrai si quelque chose a été retiré
 */
function prune(stats) {
  const keep = lastDays(KEEP_DAYS);
  let pruned = false;
  for (const day of Object.keys(stats)) {
    if (keep(day)) continue;
    delete stats[day];
    pruned = true;
  }
  return pruned;
}

/**
 * Lit les compteurs, les change, puis les réécrit, un onglet à la fois.
 * @param {(stats: Stats) => boolean} change modifie stats et dit s'il faut l'écrire
 */
const update = (change) =>
  navigator.locks.request(LOCK_NAME, async () => {
    if (!guard()) return;
    const stats = asStats((await chrome.storage.local.get(STATS_KEY))[STATS_KEY]);
    if (change(stats)) await chrome.storage.local.set({ [STATS_KEY]: stats });
  });

function flush() {
  window.clearTimeout(flushTimer);
  flushTimer = 0;
  if (!Object.keys(pending).length || !guard()) return;
  const batch = pending;
  pending = {};
  update((stats) => {
    for (const [day, counts] of Object.entries(batch)) {
      stats[day] ??= {};
      for (const [category, n] of Object.entries(counts)) stats[day][category] = (stats[day][category] ?? 0) + n;
    }
    prune(stats);
    return true;
  });
}

// Un onglet caché va souvent être fermé : on écrit sans attendre la fin du délai.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flush();
});

/**
 * Compte un message masqué. Les écritures sont regroupées pour ne pas
 * solliciter le stockage à chaque tweet : au plus deux secondes après le
 * premier message en attente, ou tout de suite si l'onglet est caché.
 * @param {string} category
 */
export function recordHidden(category) {
  const day = dayKey(new Date());
  pending[day] ??= {};
  pending[day][category] = (pending[day][category] ?? 0) + 1;
  if (!flushTimer) flushTimer = window.setTimeout(flush, FLUSH_DELAY_MS);
}

/**
 * Efface les jours trop anciens même quand plus rien n'est masqué. N'écrit
 * que s'il y a quelque chose à effacer. À appeler depuis le script de page :
 * son verrou n'est partagé qu'avec les autres onglets X.
 */
export function pruneStats() {
  return update(prune);
}

/**
 * Totaux par catégorie sur les derniers jours, aujourd'hui compris.
 * @param {number} days
 * @returns {Promise<{ total: number, byCategory: Record<string, number> }>}
 */
export async function readStats(days) {
  const stats = asStats((await chrome.storage.local.get(STATS_KEY))[STATS_KEY]);
  const recent = lastDays(days);
  /** @type {Record<string, number>} */
  const byCategory = {};
  let total = 0;
  for (const [day, counts] of Object.entries(stats)) {
    if (!recent(day)) continue;
    for (const [category, n] of Object.entries(counts)) {
      byCategory[category] = (byCategory[category] ?? 0) + n;
      total += n;
    }
  }
  return { total, byCategory };
}
