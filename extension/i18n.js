/**
 * Textes de l'interface. La langue suit celle de X (attribut lang de la page,
 * qui reflète le réglage de langue du compte), pas celle du navigateur : on
 * lit X dans la langue qu'on a choisie pour X. Pas de sélecteur de langue.
 *
 * Les textes sont dans extension/_locales (format des extensions Chrome) ;
 * chrome.i18n ne sert qu'au nom et à la description dans le manifest.
 */
import en from "./_locales/en/messages.json" with { type: "json" };
import es from "./_locales/es/messages.json" with { type: "json" };
import fr from "./_locales/fr/messages.json" with { type: "json" };
import pt from "./_locales/pt/messages.json" with { type: "json" };

/** @typedef {"fr" | "en" | "es" | "pt"} Locale */
/** @typedef {Record<string, { message: string, placeholders?: Record<string, { content: string }> }>} Messages */

/** @type {Record<Locale, Messages>} */
const MESSAGES = { fr, en, es, pt };
// Langue de X non traduite (allemand, arabe…) : l'anglais est le plus partagé.
const FALLBACK = "en";

/**
 * "fr-FR", "pt-BR", "en" donnent "fr", "pt", "en".
 * @param {string | null | undefined} lang
 * @returns {Locale}
 */
export function pickLocale(lang) {
  const base = (lang ?? "").toLowerCase().split(/[-_]/)[0];
  return base in MESSAGES ? /** @type {Locale} */ (base) : FALLBACK;
}

/** @type {Locale} */
let locale = pickLocale(globalThis.navigator?.language);

/** @param {string | null | undefined} lang */
export function setLocale(lang) {
  locale = pickLocale(lang);
}

export const getLocale = () => locale;

/**
 * @param {string} key
 * @param {(string | number)[]} substitutions remplacent $1, $2… des placeholders
 */
export function t(key, ...substitutions) {
  const entry = MESSAGES[locale][key] ?? MESSAGES.fr[key];
  if (!entry) return key;
  return entry.message.replace(/\$([A-Z_]+)\$/g, (match, name) => {
    const index = Number(entry.placeholders?.[name.toLowerCase()]?.content.slice(1)) - 1;
    return index >= 0 && index < substitutions.length ? String(substitutions[index]) : match;
  });
}

/**
 * Deux clés, ...One et ...Many, pour les pluriels.
 * @param {string} key
 * @param {number} count
 */
export const plural = (key, count) => t(`${key}${count > 1 ? "Many" : "One"}`, count);

/** @param {string} category */
export const categoryLabel = (category) => t(`category_${category}`);
