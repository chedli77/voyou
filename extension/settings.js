/**
 * Réglages de l'utilisateur, partagés entre la popup et le script injecté
 * dans X. Ils vivent dans chrome.storage.local et ne quittent pas l'appareil.
 */
import { CATEGORIES, DEFAULT_CATEGORIES } from "./detection/categories.js";

/**
 * @typedef {import("./detection/categories.js").Category} Category
 * @typedef {import("./detection/score.js").Sensitivity} Sensitivity
 *
 * @typedef {object} Settings
 * @property {boolean} enabled
 * @property {Category[]} categories filtres activés
 * @property {Sensitivity} sensitivity
 * @property {string[]} allowedHandles comptes dont les posts ne sont jamais masqués
 */

/** @type {{ id: Sensitivity, label: string }[]} */
export const SENSITIVITIES = [
  { id: "low", label: "Souple" },
  { id: "medium", label: "Équilibrée" },
  { id: "high", label: "Stricte" },
];

/** @type {Settings} */
export const DEFAULT_SETTINGS = {
  enabled: true,
  categories: DEFAULT_CATEGORIES,
  sensitivity: "medium",
  allowedHandles: [],
};

export const SETTING_KEYS = /** @type {(keyof Settings)[]} */ (Object.keys(DEFAULT_SETTINGS));

const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));
const SENSITIVITY_IDS = new Set(SENSITIVITIES.map((s) => s.id));

/**
 * Comptes X valides, sans @ ni doublon, en minuscules.
 * @param {unknown} value liste, ou texte avec un compte par ligne
 * @returns {string[]}
 */
export function parseHandles(value) {
  const items = Array.isArray(value) ? value : String(value ?? "").split(/[\s,;]+/);
  const handles = items
    .map((h) => String(h).trim().replace(/^@/, "").toLowerCase())
    .filter((h) => /^\w{1,15}$/.test(h));
  return [...new Set(handles)];
}

/**
 * Ignore tout ce qui n'est pas une valeur attendue : le stockage peut
 * contenir des données d'une ancienne version.
 * @param {Record<string, unknown>} raw
 * @returns {Settings}
 */
export function sanitizeSettings(raw) {
  const categories = Array.isArray(raw.categories)
    ? /** @type {Category[]} */ (raw.categories.filter((c) => CATEGORY_IDS.has(c)))
    : DEFAULT_SETTINGS.categories;
  const sensitivity = /** @type {Sensitivity} */ (
    SENSITIVITY_IDS.has(/** @type {Sensitivity} */ (raw.sensitivity)) ? raw.sensitivity : DEFAULT_SETTINGS.sensitivity
  );
  return {
    enabled: raw.enabled !== false,
    categories,
    sensitivity,
    allowedHandles: parseHandles(raw.allowedHandles ?? []),
  };
}

/** @returns {Promise<Settings>} */
export async function loadSettings() {
  return sanitizeSettings(await chrome.storage.local.get(DEFAULT_SETTINGS));
}

/** @param {Partial<Settings>} changes */
export function saveSettings(changes) {
  return chrome.storage.local.set(changes);
}
