/**
 * Détecteur Voyou : note un texte à partir de deux listes.
 * blocklist.json contient des mots (insultes, termes racistes), patterns.json
 * des motifs regex (renvois, déshumanisation, menaces, emojis).
 *
 * Fonction pure et synchrone, sans aucun accès réseau. Le même fichier tourne
 * dans l'extension (bundle esbuild) et dans les tests Node.
 */
import manifest from "../manifest.json" with { type: "json" };
import blocklist from "./lists/blocklist.json" with { type: "json" };
import patterns from "./lists/patterns.json" with { type: "json" };
import { textVariants } from "./normalize.js";

export const VERSION = manifest.version;

/**
 * @typedef {"pass" | "blur" | "collapse"} Action
 * @typedef {"low" | "medium" | "high"} Sensitivity
 * @typedef {"fr" | "en" | "auto"} Lang
 *
 * @typedef {object} Match
 * @property {"blocklist" | "pattern"} layer
 * @property {string} id identifiant de l'entrée dans la liste
 * @property {string} termOrPattern mot ou regex qui a correspondu
 * @property {[number, number]} [span] position dans le texte d'origine, si connue
 * @property {number} weight
 *
 * @typedef {object} Result
 * @property {boolean} match vrai si le texte doit être masqué
 * @property {Action} action
 * @property {number} score entre 0 et 1
 * @property {"none" | "low" | "medium" | "high"} severity
 * @property {string[]} categories
 * @property {Match[]} matches
 * @property {string} reasonLocal résumé lisible, ne quitte jamais l'appareil
 * @property {string} version
 *
 * @typedef {Match & { category: string, gated: boolean, via?: "norm" | "glued" | "masked" }} Hit
 */

/** @type {Record<Sensitivity, { blur: number, collapse: number }>} */
const THRESHOLDS = {
  low: { blur: 0.7, collapse: 0.9 },
  medium: { blur: 0.5, collapse: 0.75 },
  high: { blur: 0.35, collapse: 0.6 },
};

// Une insulte masquée ("b*ugnoule") compte moins : elle est floutée, jamais repliée.
const MASKED_WEIGHT = 0.6;

const BEFORE_WORD = "(?:^|[^\\p{L}\\p{N}_])";
const AFTER_WORD = "(?:$|[^\\p{L}\\p{N}_])";

/** @param {string} s */
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Le mot entier, quelle que soit la casse. Le flag d donne la position du groupe.
 * @param {string} term
 */
const wordRegExp = (term) => new RegExp(`${BEFORE_WORD}(${escapeRegExp(term)})${AFTER_WORD}`, "iud");

/**
 * Version masquée d'un mot d'au moins 5 lettres : la première lettre est
 * gardée et au plus une lettre sur trois est remplacée par * ou #.
 * @param {string} term
 * @returns {((text: string) => boolean) | null}
 */
function maskedMatcher(term) {
  const chars = [...term];
  if (chars.length < 5 || /[\s'’-]/.test(term)) return null;
  const body = chars.map((c, i) => (i === 0 ? escapeRegExp(c) : `(?:${escapeRegExp(c)}|[*#])`)).join("");
  const re = new RegExp(`${BEFORE_WORD}${body}${AFTER_WORD}`, "iu");
  const maxMasks = Math.floor(chars.length / 3);
  return (text) => {
    const masks = re.exec(text)?.[0].match(/[*#]/g)?.length ?? 0;
    return masks >= 1 && masks <= maxMasks;
  };
}

// Les regex sont compilées une seule fois, au chargement.
const BLOCKLIST = blocklist.entries.map((entry) => ({
  entry,
  terms: entry.terms.map((term) => ({
    term,
    exact: wordRegExp(term),
    // "salearabe" : terme en plusieurs mots écrit sans espaces, ou espacé lettre par lettre.
    glued: /\s/.test(term) ? wordRegExp(term.replace(/\s+/g, "")) : null,
    masked: maskedMatcher(term),
  })),
}));

const PATTERNS = patterns.entries.map((entry) => ({ entry, re: new RegExp(entry.pattern, entry.flags) }));

/**
 * @param {string} entryLang
 * @param {Lang} lang
 */
const langMatches = (entryLang, lang) => lang === "auto" || entryLang === "any" || entryLang === lang;

/**
 * @param {typeof BLOCKLIST[number]["terms"]} terms
 * @param {string} text
 * @returns {{ term: string, span?: [number, number], via?: "glued" | "masked" } | null}
 */
function findTerm(terms, text) {
  for (const t of terms) {
    const m = t.exact.exec(text);
    if (m) return { term: t.term, span: m.indices?.[1] };
  }
  for (const t of terms) {
    if (t.glued?.test(text)) return { term: t.term, via: "glued" };
  }
  if (/[*#]/.test(text)) {
    for (const t of terms) {
      if (t.masked?.(text)) return { term: t.term, via: "masked" };
    }
  }
  return null;
}

/**
 * @param {string} text
 * @param {Lang} lang
 * @returns {Hit[]}
 */
function matchBlocklist(text, lang) {
  /** @type {Hit[]} */
  const hits = [];
  for (const { entry, terms } of BLOCKLIST) {
    if (!langMatches(entry.lang, lang)) continue;
    const found = findTerm(terms, text);
    if (!found) continue;
    const weight = found.via === "masked" ? Math.round(entry.weight * MASKED_WEIGHT * 1000) / 1000 : entry.weight;
    hits.push({
      layer: "blocklist",
      id: entry.id,
      termOrPattern: found.term,
      span: found.span,
      weight,
      category: entry.category,
      gated: entry.requireAttackCompanion === true,
      via: found.via,
    });
  }
  return hits;
}

/**
 * @param {string} text
 * @param {Lang} lang
 * @returns {Hit[]}
 */
function matchPatterns(text, lang) {
  /** @type {Hit[]} */
  const hits = [];
  for (const { entry, re } of PATTERNS) {
    if (!langMatches(entry.lang, lang)) continue;
    const m = re.exec(text);
    if (!m) continue;
    hits.push({
      layer: "pattern",
      id: entry.id,
      termOrPattern: entry.pattern,
      span: [m.index, m.index + m[0].length],
      weight: entry.weight,
      category: entry.category,
      gated: false,
    });
  }
  return hits;
}

/**
 * Teste le texte d'origine puis ses variantes normalisées, et garde la
 * correspondance la plus forte pour chaque entrée. Les positions ne valent
 * que pour le texte d'origine, elles sont retirées sur les variantes.
 * @param {string} text
 * @param {Lang} lang
 */
function collectHits(text, lang) {
  /** @type {Map<string, Hit>} */
  const best = new Map();
  [text, ...textVariants(text)].forEach((variant, i) => {
    for (const hit of [...matchBlocklist(variant, lang), ...matchPatterns(variant, lang)]) {
      if (i > 0) {
        hit.span = undefined;
        hit.via ??= "norm";
      }
      const previous = best.get(hit.id);
      if (!previous || hit.weight > previous.weight) best.set(hit.id, hit);
    }
  });
  const hits = [...best.values()];
  // Certains mots ambigus ("nègre" littéraire, "raton" laveur) ne comptent
  // que si un autre signal d'attaque est présent dans le même texte.
  const hasCompanion = hits.some((h) => !h.gated);
  return hits.filter((h) => !h.gated || hasCompanion);
}

/** @param {number} score */
function severityOf(score) {
  if (score < 0.2) return "none";
  if (score < 0.5) return "low";
  if (score < 0.75) return "medium";
  return "high";
}

/**
 * @param {number} score
 * @param {Sensitivity} sensitivity
 * @returns {Action}
 */
function actionOf(score, sensitivity) {
  const t = THRESHOLDS[sensitivity] ?? THRESHOLDS.medium;
  if (score >= t.collapse) return "collapse";
  if (score >= t.blur) return "blur";
  return "pass";
}

/**
 * @param {{ text: string, lang?: Lang, sensitivity?: Sensitivity }} input
 * @returns {Result}
 */
export function scoreText({ text, lang = "auto", sensitivity = "medium" }) {
  const hits = text.trim() ? collectHits(text, lang) : [];
  const score = Math.min(
    1,
    hits.reduce((sum, h) => sum + h.weight, 0),
  );
  const action = actionOf(score, sensitivity);
  return {
    match: action !== "pass",
    action,
    score: Math.round(score * 1000) / 1000,
    severity: severityOf(score),
    categories: [...new Set(hits.map((h) => h.category))],
    matches: hits.map(({ layer, id, termOrPattern, span, weight }) => ({ layer, id, termOrPattern, span, weight })),
    reasonLocal: text.trim()
      ? hits.map((h) => `${h.layer}:${h.id}${h.via ? `~${h.via}` : ""}`).join(", ") || "no_hit"
      : "empty",
    version: VERSION,
  };
}
