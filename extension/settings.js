/**
 * Réglages de l'utilisateur, partagés entre la popup et le script injecté
 * dans X. Ils vivent dans chrome.storage.local et ne quittent pas l'appareil.
 */
import { CATEGORIES, DEFAULT_CATEGORIES } from "./detection/categories.js";
import { guard } from "./lifecycle.js";

/**
 * @typedef {import("./detection/categories.js").Category} Category
 * @typedef {import("./detection/score.js").Sensitivity} Sensitivity
 *
 * @typedef {object} Settings
 * @property {boolean} enabled
 * @property {Category[]} categories filtres activés
 * @property {Sensitivity} sensitivity
 * @property {string[]} allowedHandles comptes dont les posts ne sont jamais masqués
 * @property {string[]} customTerms mots ou expressions à toujours masquer
 * @property {string[]} mutedRules règles désactivées avec « Ce n'est pas de la haine »
 */

/** @type {Sensitivity[]} */
export const SENSITIVITIES = ["low", "medium", "high"];

// Garde-fous : le stockage local est limité et une liste énorme ralentirait chaque tweet.
const MAX_CUSTOM_TERMS = 200;
const MAX_TERM_LENGTH = 60;

/** @type {Settings} */
export const DEFAULT_SETTINGS = {
  enabled: true,
  categories: DEFAULT_CATEGORIES,
  sensitivity: "medium",
  allowedHandles: [],
  customTerms: [],
  mutedRules: [],
};

export const SETTING_KEYS = /** @type {(keyof Settings)[]} */ (Object.keys(DEFAULT_SETTINGS));

const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));
const SENSITIVITY_IDS = new Set(SENSITIVITIES);

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
 * Mots perso : un par ligne, sans doublon, en minuscules.
 * @param {unknown} value liste, ou texte avec un mot par ligne
 * @returns {string[]}
 */
export function parseTerms(value) {
  const items = Array.isArray(value) ? value : String(value ?? "").split("\n");
  const terms = items
    .map((term) => String(term).trim().replace(/\s+/g, " ").toLowerCase())
    .filter((term) => term.length >= 2 && term.length <= MAX_TERM_LENGTH);
  return [...new Set(terms)].slice(0, MAX_CUSTOM_TERMS);
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
    customTerms: parseTerms(raw.customTerms ?? []),
    mutedRules: Array.isArray(raw.mutedRules)
      ? [...new Set(raw.mutedRules.filter((id) => typeof id === "string" && /^[a-z0-9-]{1,64}$/.test(id)))]
      : [],
  };
}

/** @returns {Promise<Settings>} */
export async function loadSettings() {
  return sanitizeSettings(await chrome.storage.local.get(DEFAULT_SETTINGS));
}

/**
 * Sans effet si l'extension a été rechargée : un ancien onglet ne peut plus écrire.
 * @param {Partial<Settings>} changes
 */
export async function saveSettings(changes) {
  if (guard()) await chrome.storage.local.set(changes);
}
