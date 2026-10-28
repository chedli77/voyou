/**
 * Statistiques locales : combien de messages ont été masqués, par jour et par
 * catégorie. Aucun texte, aucun compte, aucun identifiant de tweet n'est
 * gardé, seulement des compteurs, et seulement sur les 30 derniers jours.
 */

import { guard } from "./lifecycle.js";

const STATS_KEY = "stats";
const KEEP_DAYS = 30;
const FLUSH_DELAY_MS = 2000;

/** @typedef {Record<string, Record<string, number>>} Stats jour (AAAA-MM-JJ) puis catégorie */

/** @param {Date} date */
export const dayKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** @type {Stats} */
let pending = {};
let flushTimer = 0;

/** @param {unknown} value */
const asStats = (value) => /** @type {Stats} */ (value && typeof value === "object" ? value : {});

async function flush() {
  if (!guard()) return;
  const batch = pending;
  pending = {};
  const stats = asStats((await chrome.storage.local.get(STATS_KEY))[STATS_KEY]);
  for (const [day, counts] of Object.entries(batch)) {
    stats[day] ??= {};
    for (const [category, n] of Object.entries(counts)) stats[day][category] = (stats[day][category] ?? 0) + n;
  }
  const oldest = dayKey(new Date(Date.now() - KEEP_DAYS * 86_400_000));
  for (const day of Object.keys(stats)) if (day < oldest) delete stats[day];
  await chrome.storage.local.set({ [STATS_KEY]: stats });
}

/**
 * Compte un message masqué. Les écritures sont regroupées toutes les deux
 * secondes pour ne pas solliciter le stockage à chaque tweet.
 * @param {string} category
 */
export function recordHidden(category) {
  const day = dayKey(new Date());
  pending[day] ??= {};
  pending[day][category] = (pending[day][category] ?? 0) + 1;
  window.clearTimeout(flushTimer);
  flushTimer = window.setTimeout(flush, FLUSH_DELAY_MS);
}

/**
 * Totaux par catégorie sur les derniers jours.
 * @param {number} days
 * @returns {Promise<{ total: number, byCategory: Record<string, number> }>}
 */
export async function readStats(days) {
  const stats = asStats((await chrome.storage.local.get(STATS_KEY))[STATS_KEY]);
  const since = dayKey(new Date(Date.now() - (days - 1) * 86_400_000));
  /** @type {Record<string, number>} */
  const byCategory = {};
  let total = 0;
  for (const [day, counts] of Object.entries(stats)) {
    if (day < since) continue;
    for (const [category, n] of Object.entries(counts)) {
      byCategory[category] = (byCategory[category] ?? 0) + n;
      total += n;
    }
  }
  return { total, byCategory };
}
