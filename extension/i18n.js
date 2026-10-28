/**
 * Textes de l'interface, traduits dans extension/_locales selon la langue du
 * navigateur (français par défaut).
 */

/**
 * @param {string} key
 * @param {(string | number)[]} substitutions
 */
export const t = (key, ...substitutions) => chrome.i18n.getMessage(key, substitutions.map(String)) || key;

/**
 * chrome.i18n ne gère pas les pluriels : deux clés, ...One et ...Many.
 * @param {string} key
 * @param {number} count
 */
export const plural = (key, count) => t(`${key}${count > 1 ? "Many" : "One"}`, count);

/** @param {string} category */
export const categoryLabel = (category) => t(`category_${category}`);
