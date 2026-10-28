/**
 * Détecteur Voyou : note un texte à partir des listes de lists/, une par
 * langue plus multi.json pour ce qui ne dépend pas de la langue (emojis…).
 * Chaque liste contient des mots ("terms") et des motifs regex ("patterns").
 *
 * Fonction pure et synchrone, sans aucun accès réseau. Le même fichier tourne
 * dans l'extension (bundle esbuild) et dans les tests Node.
 */
import manifest from "../manifest.json" with { type: "json" };
import ar from "./lists/ar.json" with { type: "json" };
import de from "./lists/de.json" with { type: "json" };
import en from "./lists/en.json" with { type: "json" };
import es from "./lists/es.json" with { type: "json" };
import fr from "./lists/fr.json" with { type: "json" };
import it from "./lists/it.json" with { type: "json" };
import multi from "./lists/multi.json" with { type: "json" };
import pt from "./lists/pt.json" with { type: "json" };
import { DEFAULT_CATEGORIES } from "./categories.js";
import { textVariants } from "./normalize.js";

export const VERSION = manifest.version;

/**
 * @typedef {"pass" | "blur" | "collapse"} Action
 * @typedef {"low" | "medium" | "high"} Sensitivity
 * @typedef {"fr" | "en" | "es" | "pt" | "it" | "de" | "ar" | "auto"} Lang
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
 * Un des mots, entier, quelle que soit la casse. Les plus longs d'abord, pour
 * que « sales arabes » l'emporte sur « sale arabe ». Le flag d donne la
 * position du mot trouvé.
 * @param {readonly string[]} terms
 */
const wordsRegExp = (terms) =>
  new RegExp(
    `${BEFORE_WORD}(${[...terms]
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp)
      .join("|")})${AFTER_WORD}`,
    "iud",
  );

/**
 * Un mot d'au moins 5 lettres avec certaines lettres remplacées par * ou #
 * (« b*ugnoule ») : la première lettre est visible et au plus une lettre sur
 * trois est masquée. Comparaison lettre à lettre, sans regex : compiler une
 * regex par mot coûtait plusieurs centaines de millisecondes au premier
 * texte contenant une étoile.
 * @param {string[]} token mot du texte, en minuscules, découpé en caractères
 * @param {string[]} term mot de la liste, en minuscules, découpé en caractères
 */
function maskedEquals(token, term) {
  if (token.length !== term.length || token[0] !== term[0]) return false;
  let masks = 0;
  for (let i = 1; i < term.length; i++) {
    if (token[i] === "*" || token[i] === "#") masks++;
    else if (token[i] !== term[i]) return false;
  }
  return masks >= 1 && masks <= Math.floor(term.length / 3);
}

/** @param {string} text */
const maskedTokens = (text) =>
  (text.toLowerCase().match(/[\p{L}\p{N}*#]+/gu) ?? []).filter((w) => /[*#]/.test(w)).map((w) => [...w]);

/** @type {Record<Exclude<Lang, "auto"> | "multi", RuleList>} */
export const LISTS = /** @type {any} */ ({ fr, en, es, pt, it, de, ar, multi });

/**
 * Une regex par règle pour tous ses mots, plutôt qu'une par mot : le moteur
 * compile chaque regex à sa première utilisation, et il y a des centaines de mots.
 * @param {string} lang
 * @param {TermEntry} entry
 */
function compileTermRule(lang, entry) {
  const multiWord = entry.terms.filter((term) => /\s/.test(term));
  return {
    lang,
    entry,
    exact: wordsRegExp(entry.terms),
    // "salearabe" : terme en plusieurs mots écrit sans espaces, ou espacé lettre par lettre.
    glued: multiWord.length ? wordsRegExp(multiWord.map((term) => term.replace(/\s+/g, ""))) : null,
    masked: entry.terms
      .filter((term) => [...term].length >= 5 && !/[\s'’-]/.test(term))
      .map((term) => [...term.toLowerCase()]),
  };
}

/** @typedef {ReturnType<typeof compileTermRule>} TermRule */

// Les regex sont compilées une seule fois, au chargement.
const TERM_RULES = Object.entries(LISTS).flatMap(([lang, list]) =>
  list.terms.map((entry) => compileTermRule(lang, entry)),
);

// Les mots perso changent rarement : on garde la dernière compilation.
let customCache = { key: "", rules: /** @type {TermRule[]} */ ([]) };

/**
 * Mots ajoutés par l'utilisateur : toujours masqués, quelle que soit la
 * sensibilité, avec les mêmes protections contre les déguisements.
 * @param {readonly string[]} words
 * @returns {TermRule[]}
 */
function customRules(words) {
  const key = words.join("\n");
  if (key !== customCache.key) {
    customCache = {
      key,
      rules: words.map((word, i) =>
        compileTermRule("multi", {
          id: `custom-${i}`,
          category: "custom",
          weight: 1,
          // Le pluriel est pris aussi : on ne demande pas à l'utilisateur d'y penser.
          terms: [...new Set([word, `${word}s`, `${word}es`, `${word}x`])],
          note: "",
        }),
      ),
    };
  }
  return customCache.rules;
}

// En JavaScript, \b ne connaît que les lettres ASCII : à côté d'un « é » ou
// d'une lettre arabe, il ne voit pas la frontière du mot. Chaque \b des
// motifs est remplacé par une frontière qui connaît toutes les lettres :
// « pas de lettre avant » quand il ouvre un mot (suivi d'une lettre, d'une
// classe ou d'un groupe), « pas de lettre après » sinon. Une seule assertion
// par position : un motif reste rapide sur un texte long.
const WORD_START = "(?<![\\p{L}\\p{N}_])";
const WORD_END = "(?![\\p{L}\\p{N}_])";
// Une classe comme [\s\S] ou [^…] n'ouvre pas un mot.
const OPENS_WORD = /^(?:[\p{L}\d_]|\[(?!\^|\\[sS])|\((?!\?[=!<])|\\[pw])/u;

/** @param {string} pattern */
const unicodeBoundaries = (pattern) =>
  pattern.replace(/(?<!\\)\\b/g, (_, offset) => (OPENS_WORD.test(pattern.slice(offset + 2)) ? WORD_START : WORD_END));

/** @param {PatternEntry} entry */
function compilePattern(entry) {
  const flags = entry.flags.includes("u") ? entry.flags : `${entry.flags}u`;
  return new RegExp(unicodeBoundaries(entry.pattern), flags);
}

const PATTERN_RULES = Object.entries(LISTS).flatMap(([lang, list]) =>
  list.patterns.map((entry) => ({ lang, entry, re: compilePattern(entry) })),
);

/**
 * @param {string} ruleLang langue de la liste d'où vient la règle
 * @param {Lang} lang
 */
const langMatches = (ruleLang, lang) => lang === "auto" || ruleLang === "multi" || ruleLang === lang;

/**
 * @param {TermRule} rule
 * @param {string} text
 * @param {string[][]} masked mots du texte qui contiennent * ou #
 * @returns {{ term: string, span?: [number, number], via?: "glued" | "masked" } | null}
 */
function findTerm(rule, text, masked) {
  const m = rule.exact.exec(text);
  if (m) return { term: m[1], span: m.indices?.[1] };
  const glued = rule.glued?.exec(text);
  if (glued) return { term: glued[1], via: "glued" };
  for (const token of masked) {
    const term = rule.masked.find((t) => maskedEquals(token, t));
    if (term) return { term: term.join(""), via: "masked" };
  }
  return null;
}

/**
 * @param {string} text
 * @param {Lang} lang
 * @param {readonly TermRule[]} rules
 * @returns {Hit[]}
 */
function matchTerms(text, lang, rules) {
  /** @type {Hit[]} */
  const hits = [];
  const masked = maskedTokens(text);
  for (const rule of rules) {
    if (!langMatches(rule.lang, lang)) continue;
    const { entry } = rule;
    const found = findTerm(rule, text, masked);
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
 * @param {readonly TermRule[]} termRules
 */
function collectHits(text, lang, termRules) {
  /** @type {Map<string, Hit>} */
  const best = new Map();
  [text, ...textVariants(text)].forEach((variant, i) => {
    for (const hit of [...matchTerms(variant, lang, termRules), ...matchPatterns(variant, lang)]) {
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
 * @param {readonly string[]} [input.customTerms] mots à toujours masquer, choisis par l'utilisateur
 * @param {readonly string[]} [input.mutedRules] règles que l'utilisateur a désactivées pour lui
 * @returns {Result}
 */
export function scoreText({
  text,
  lang = "auto",
  sensitivity = "medium",
  categories = DEFAULT_CATEGORIES,
  customTerms = [],
  mutedRules = [],
}) {
  const enabled = new Set([...categories, "custom"]);
  const muted = new Set(mutedRules);
  const rules = customTerms.length ? [...TERM_RULES, ...customRules(customTerms)] : TERM_RULES;
  const hits = text.trim()
    ? collectHits(text, lang, rules).filter((h) => enabled.has(h.category) && !muted.has(h.id))
    : [];
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
