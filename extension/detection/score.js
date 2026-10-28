/**
 * Détecteur Voyou : note un texte à partir des listes de lists/, une par
 * langue plus multi.json pour ce qui ne dépend pas de la langue (emojis…).
 * Chaque liste contient des mots ("terms") et des motifs regex ("patterns").
 *
 * Fonction pure et synchrone, sans aucun accès réseau. Le même fichier tourne
 * dans l'extension (bundle esbuild) et dans les tests Node.
 */
import manifest from "../manifest.json" with { type: "json" };
import de from "./lists/de.json" with { type: "json" };
import en from "./lists/en.json" with { type: "json" };
import es from "./lists/es.json" with { type: "json" };
import fr from "./lists/fr.json" with { type: "json" };
import multi from "./lists/multi.json" with { type: "json" };
import pt from "./lists/pt.json" with { type: "json" };
import { DEFAULT_CATEGORIES } from "./categories.js";
import { textVariants } from "./normalize.js";

export const VERSION = manifest.version;

/**
 * @typedef {"pass" | "blur" | "collapse"} Action
 * @typedef {"low" | "medium" | "high"} Sensitivity
 * @typedef {"fr" | "en" | "es" | "pt" | "de" | "auto"} Lang
 * @typedef {import("./categories.js").Category} Category
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
 * @property {Category[]} categories catégories trouvées, la plus lourde d'abord
 * @property {Match[]} matches
 * @property {string} reasonLocal résumé lisible, ne quitte jamais l'appareil
 * @property {string} version
 *
 * @typedef {Match & { category: Category, gated: boolean, via?: "norm" | "glued" | "masked" }} Hit
 *
 * @typedef {{ id: string, category: Category, weight: number, note: string }} BaseEntry
 * @typedef {BaseEntry & { terms: string[], requireAttackCompanion?: boolean }} TermEntry
 * @typedef {BaseEntry & { pattern: string, flags: string }} PatternEntry
 * @typedef {{ terms: TermEntry[], patterns: PatternEntry[] }} RuleList
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

/** @type {Record<Exclude<Lang, "auto"> | "multi", RuleList>} */
export const LISTS = /** @type {any} */ ({ fr, en, es, pt, de, multi });

// Les regex sont compilées une seule fois, au chargement.
const TERM_RULES = Object.entries(LISTS).flatMap(([lang, list]) =>
  list.terms.map((entry) => ({
    lang,
    entry,
    terms: entry.terms.map((term) => ({
      term,
      exact: wordRegExp(term),
      // "salearabe" : terme en plusieurs mots écrit sans espaces, ou espacé lettre par lettre.
      glued: /\s/.test(term) ? wordRegExp(term.replace(/\s+/g, "")) : null,
      masked: maskedMatcher(term),
    })),
  })),
);

const PATTERN_RULES = Object.entries(LISTS).flatMap(([lang, list]) =>
  list.patterns.map((entry) => ({ lang, entry, re: new RegExp(entry.pattern, entry.flags) })),
);

/**
 * @param {string} ruleLang langue de la liste d'où vient la règle
 * @param {Lang} lang
 */
const langMatches = (ruleLang, lang) => lang === "auto" || ruleLang === "multi" || ruleLang === lang;

/**
 * @param {typeof TERM_RULES[number]["terms"]} terms
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
  for (const { lang: ruleLang, entry, terms } of TERM_RULES) {
    if (!langMatches(ruleLang, lang)) continue;
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
  for (const { lang: ruleLang, entry, re } of PATTERN_RULES) {
    if (!langMatches(ruleLang, lang)) continue;
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
 * Catégories trouvées, de la plus lourde à la plus légère.
 * @param {Hit[]} hits
 * @returns {Category[]}
 */
function rankCategories(hits) {
  /** @type {Map<Category, number>} */
  const totals = new Map();
  for (const h of hits) totals.set(h.category, (totals.get(h.category) ?? 0) + h.weight);
  return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([category]) => category);
}

/**
 * @param {object} input
 * @param {string} input.text
 * @param {Lang} [input.lang]
 * @param {Sensitivity} [input.sensitivity]
 * @param {readonly Category[]} [input.categories] filtres activés, ceux par défaut sinon
 * @returns {Result}
 */
export function scoreText({ text, lang = "auto", sensitivity = "medium", categories = DEFAULT_CATEGORIES }) {
  const enabled = new Set(categories);
  const hits = text.trim() ? collectHits(text, lang).filter((h) => enabled.has(h.category)) : [];
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
    categories: rankCategories(hits),
    matches: hits.map(({ layer, id, termOrPattern, span, weight }) => ({ layer, id, termOrPattern, span, weight })),
    reasonLocal: text.trim()
      ? hits.map((h) => `${h.layer}:${h.id}${h.via ? `~${h.via}` : ""}`).join(", ") || "no_hit"
      : "empty",
    version: VERSION,
  };
}
