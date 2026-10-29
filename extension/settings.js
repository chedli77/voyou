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
export const MAX_CUSTOM_TERMS = 200;
export const MAX_TERM_LENGTH = 60;

/** Identifiant d'une règle des listes : le seul format gardé dans mutedRules. */
export const RULE_ID = /^[a-z0-9-]{1,64}$/;

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
 * Éléments d'une liste enregistrée, ou morceaux d'un texte saisi. Dans une
 * liste, ce qui n'est pas du texte est écarté : null ne doit pas devenir le
 * mot « null ».
 * @param {unknown} value
 * @param {RegExp} separator coupe le texte saisi
 * @returns {string[]}
 */
const listItems = (value, separator) =>
  Array.isArray(value) ? value.filter((item) => typeof item === "string") : String(value ?? "").split(separator);

/**
 * Comptes X valides, sans @ ni doublon, en minuscules.
 * @param {unknown} value liste, ou texte avec un compte par ligne
 * @returns {string[]}
 */
export function parseHandles(value) {
  const handles = listItems(value, /[\s,;]+/)
    .map((h) => h.trim().replace(/^@/, "").toLowerCase())
    .filter((h) => /^\w{1,15}$/.test(h));
  return [...new Set(handles)];
}

/**
 * Mots perso : un par ligne, sans doublon, en minuscules. Mis en forme NFKC,
 * comme les variantes du texte (normalize.js) : un mot collé avec ses accents
 * décomposés (fréquent depuis un PDF ou un nom de fichier macOS) correspond
 * quand même au texte de X.
 * @param {unknown} value liste, ou texte avec un mot par ligne
 * @returns {string[]}
 */
export function parseTerms(value) {
  const terms = listItems(value, /\n/)
    .map((term) => term.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase())
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
      ? [...new Set(raw.mutedRules.filter((id) => typeof id === "string" && RULE_ID.test(id)))]
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
