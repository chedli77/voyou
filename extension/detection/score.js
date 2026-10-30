/**
 * Détecteur Voyou : note un texte à partir des listes de lists/, une par
 * langue plus multi.json pour ce qui ne dépend pas de la langue (emojis…).
 * Chaque liste contient des mots ("terms") et des motifs regex ("patterns").
 *
 * Fonction pure et synchrone, sans aucun accès réseau. Le même fichier tourne
 * dans l'extension (bundle esbuild) et dans les tests Node.
 */
import manifest from "../manifest.json" with { type: "json" };
import { DEFAULT_CATEGORIES } from "./categories.js";
import { LISTS } from "./lists.js";
import { plainArabic, textVariants, unifyArabic } from "./normalize.js";

export const VERSION = manifest.version;

/**
 * @typedef {"pass" | "blur" | "collapse"} Action
 * @typedef {"low" | "medium" | "high"} Sensitivity
 * @typedef {"message" | "name"} Scope "name" : un nom d'affichage, pas un message entier
 * @typedef {import("./categories.js").Category} Category
 *
 * @typedef {object} Match
 * @property {"blocklist" | "pattern"} layer
 * @property {string} id identifiant de l'entrée dans la liste
 * @property {string} termOrPattern mot ou regex qui a correspondu
 * @property {number} weight
 *
 * @typedef {object} Result
 * @property {boolean} match vrai si le texte doit être masqué
 * @property {Action} action
 * @property {number} score entre 0 et 1
 * @property {Category[]} categories catégories trouvées, la plus lourde d'abord
 * @property {Match[]} matches
 * @property {string} reasonLocal résumé lisible, ne quitte jamais l'appareil
 * @property {string} version
 *
 * @typedef {Match & { category: Category, gated: boolean, via?: "norm" | "glued" | "masked" }} Hit
 *
 * @typedef {{ id: string, category: Category, weight: number, note: string, strictDoubles?: boolean }} BaseEntry
 * @typedef {BaseEntry & { terms: string[], requireAttackCompanion?: boolean }} TermEntry
 * @typedef {BaseEntry & { pattern: string, flags: string, wholeMessage?: boolean }} PatternEntry
 * @typedef {{ terms: TermEntry[], patterns: PatternEntry[] }} RuleList
 */

/** @type {Record<Sensitivity, { blur: number, collapse: number }>} */
const THRESHOLDS = {
  low: { blur: 0.7, collapse: 0.9 },
  medium: { blur: 0.5, collapse: 0.75 },
  high: { blur: 0.35, collapse: 0.6 },
};

// Une insulte masquée ("b*ugnoule") compte pour 60 % du poids de sa règle.
const MASKED_WEIGHT = 0.6;

// En JavaScript, \b et \w ne connaissent que les lettres ASCII : à côté d'un
// « é » ou d'une lettre arabe, \b ne voit pas la frontière du mot. Les mots
// et les motifs des listes utilisent à la place ces classes, qui connaissent
// toutes les lettres. Les frontières sont des assertions qui ne consomment
// aucun caractère : une seule vérification par position, ce qui garde les
// regex rapides sur un texte long ou plein d'emojis.
const WORD_CHARS = "\\p{L}\\p{N}_";
const WORD_START = `(?<![${WORD_CHARS}])`;
const WORD_END = `(?![${WORD_CHARS}])`;

// L'apostrophe droite et ses formes typographiques : la ponctuation
// intelligente d'iOS écrit « I’ll » ou « ‘em ». Une apostrophe des listes ou
// des mots perso les accepte toutes.
const APOSTROPHES = "'‘’ʼ";
const APOSTROPHE_RE = new RegExp(`[${APOSTROPHES}]`, "g");

// Entre les mots d'une expression, le texte peut mettre n'importe quelle
// suite de blancs, de tirets ou de _ : « jungle  bunny », un saut de ligne,
// « porch-monkey », « #sale_arabe ». Seules les suites entre deux mots
// comptent : un mot perso fait de tirets reste un mot entier.
const SEPARATOR_CHARS = "\\s\\p{Pd}_";
const SEPARATOR = `[${SEPARATOR_CHARS}]+`;
const INNER_SEPARATOR_RE = new RegExp(`(?<=[^${SEPARATOR_CHARS}])${SEPARATOR}(?=[^${SEPARATOR_CHARS}])`, "u");

/** @param {string} s */
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** @param {string} term */
const splitWords = (term) => term.split(INNER_SEPARATOR_RE);

/** @param {string} term */
const termSource = (term) =>
  splitWords(term)
    .map((word) => escapeRegExp(word).replace(APOSTROPHE_RE, `[${APOSTROPHES}]`))
    .join(SEPARATOR);

/**
 * Un des mots, entier, quelle que soit la casse. Les plus longs d'abord :
 * quand un mot de la règle en prolonge un autre (« x » et « x y »), c'est le
 * plus long qui est rapporté.
 * @param {readonly string[]} terms
 */
const wordsRegExp = (terms) =>
  new RegExp(
    `${WORD_START}(?:${[...terms]
      .sort((a, b) => b.length - a.length)
      .map(termSource)
      .join("|")})${WORD_END}`,
    "iu",
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

const MASK_RE = /[*#]/;
// Les mots du texte sont découpés sur les lettres et les chiffres : seul un
// mot fait de lettres et de chiffres peut s'y comparer lettre à lettre.
const MASKABLE_RE = /^[\p{L}\p{N}]{5,}$/u;

/** @param {string} text */
const maskedTokens = (text) =>
  MASK_RE.test(text)
    ? (text.toLowerCase().match(/[\p{L}\p{N}*#]+/gu) ?? []).filter((w) => MASK_RE.test(w)).map((w) => [...w])
    : [];

export { LISTS };

/**
 * Une regex par règle pour tous ses mots, plutôt qu'une par mot : le moteur
 * compile chaque regex à sa première utilisation, et il y a des centaines de
 * mots. Les lettres arabes sont unifiées comme celles du texte.
 * @param {TermEntry} entry
 */
function compileTermRule(entry) {
  const terms = entry.terms.map(unifyArabic);
  // "salearabe" : expression écrite sans séparateur, ou espacée lettre par lettre.
  const glued = terms
    .map(splitWords)
    .filter((words) => words.length > 1)
    .map((words) => words.join(""));
  return {
    entry,
    exact: wordsRegExp(terms),
    glued: glued.length ? wordsRegExp(glued) : null,
    // Une expression masquée se compare collée : « k*somak ».
    masked: [...new Set([...terms, ...glued])]
      .filter((term) => MASKABLE_RE.test(term))
      .map((term) => [...term.toLowerCase()]),
  };
}

/** @typedef {ReturnType<typeof compileTermRule>} TermRule */

// Les regex sont compilées une seule fois, au chargement.
const TERM_RULES = Object.values(LISTS).flatMap((list) => list.terms.map(compileTermRule));

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
        compileTermRule({
          id: `custom-${i}`,
          category: "custom",
          weight: 1,
          // Les pluriels réguliers sont pris aussi ; un pluriel irrégulier
          // (chevaux) s'écrit sur sa propre ligne.
          terms: [...new Set([word, `${word}s`, `${word}es`, `${word}x`])],
          note: "",
        }),
      ),
    };
  }
  return customCache.rules;
}

// Une classe comme [\s\S] ou [^…] n'ouvre pas un mot.
const OPENS_WORD = /^(?:[\p{L}\d_]|\[(?!\^|\\[sS])|\((?!\?[=!<])|\\[pw])/u;
const LOOKBEHIND_RE = /^\(\?<[=!]/;

/**
 * La suite du motif après ses regards en arrière : dans « \b(?<!ele\s)vai »,
 * c'est « vai » qui dit si le \b ouvre un mot.
 * @param {string} rest
 */
function afterLookbehinds(rest) {
  while (LOOKBEHIND_RE.test(rest)) {
    let depth = 0;
    let inClass = false;
    let i = 0;
    for (; i < rest.length; i++) {
      const c = rest[i];
      if (c === "\\") i++;
      else if (inClass) inClass = c !== "]";
      else if (c === "[") inClass = true;
      else if (c === "(") depth++;
      else if (c === ")" && --depth === 0) break;
    }
    rest = rest.slice(i + 1);
  }
  return rest;
}

/**
 * Compile un motif des listes pour qu'il connaisse toutes les lettres. Chaque
 * \b devient « pas de lettre avant » quand il ouvre un mot (suivi d'une
 * lettre, d'une classe ou d'un groupe, au besoin après un regard en arrière),
 * « pas de lettre après » sinon. \w
 * devient la classe de toutes les lettres, et une apostrophe accepte ses
 * formes typographiques. Le parcours suit les classes [...] : dans une
 * classe, \w et l'apostrophe y ajoutent leurs caractères, et \b garde son
 * sens. Les lettres arabes sont unifiées comme celles du texte.
 * @param {PatternEntry} entry
 */
export function compilePattern(entry) {
  const pattern = unifyArabic(entry.pattern);
  let source = "";
  let inClass = false;
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "\\") {
      const next = pattern[++i];
      if (next === "w") source += inClass ? WORD_CHARS : `[${WORD_CHARS}]`;
      else if (next === "b" && !inClass)
        source += OPENS_WORD.test(afterLookbehinds(pattern.slice(i + 1))) ? WORD_START : WORD_END;
      else source += c + next;
    } else if (APOSTROPHES.includes(c)) {
      source += inClass ? APOSTROPHES : `[${APOSTROPHES}]`;
    } else {
      if (c === "[") inClass = true;
      else if (c === "]") inClass = false;
      source += c;
    }
  }
  return new RegExp(source, entry.flags.includes("u") ? entry.flags : `${entry.flags}u`);
}

const PATTERN_RULES = Object.values(LISTS).flatMap((list) =>
  list.patterns.map((entry) => ({ entry, re: compilePattern(entry) })),
);

/**
 * Compile les regex une à une, mots perso compris, pour étaler ce travail sur
 * les temps morts du navigateur : un pas par regex. Le moteur en garde deux
 * versions (texte Latin-1, texte avec emojis), d'où les deux exemples.
 * @param {readonly string[]} [customTerms]
 */
export function* warmUpSteps(customTerms = []) {
  const rules = [...TERM_RULES, ...customRules(customTerms)];
  const regexes = [
    ...rules.flatMap((rule) => (rule.glued ? [rule.exact, rule.glued] : [rule.exact])),
    ...PATTERN_RULES.map((rule) => rule.re),
  ];
  for (const re of regexes) {
    for (const sample of ["a b", "a \u{1F412}"]) re.exec(sample);
    yield;
  }
  scoreText({ text: "warm up b*ugnoule \u{1F412}", customTerms });
}

/**
 * @param {TermRule} rule
 * @param {string} text
 * @param {string[][]} masked mots du texte qui contiennent * ou #
 * @returns {{ term: string, via?: "glued" | "masked" } | null}
 */
function findTerm(rule, text, masked) {
  const exact = rule.exact.exec(text);
  if (exact) return { term: exact[0] };
  const glued = rule.glued?.exec(text);
  if (glued) return { term: glued[0], via: "glued" };
  for (const token of masked) {
    const term = rule.masked.find((t) => maskedEquals(token, t));
    if (term) return { term: term.join(""), via: "masked" };
  }
  return null;
}

/**
 * @param {string} text
 * @param {readonly TermRule[]} rules
 * @param {boolean} doubled le texte vient de lettres étirées réduites à deux
 * @returns {Hit[]}
 */
function matchTerms(text, rules, doubled) {
  /** @type {Hit[]} */
  const hits = [];
  const masked = maskedTokens(text);
  for (const rule of rules) {
    const { entry } = rule;
    if (doubled && entry.strictDoubles) continue;
    const found = findTerm(rule, text, masked);
    if (!found) continue;
    // Un mot perso masqué compte en entier : il doit être masqué à toutes les sensibilités.
    const weight =
      found.via === "masked" && entry.category !== "custom"
        ? Math.round(entry.weight * MASKED_WEIGHT * 1000) / 1000
        : entry.weight;
    hits.push({
      layer: "blocklist",
      id: entry.id,
      termOrPattern: found.term,
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
 * @param {boolean} doubled le texte vient de lettres étirées réduites à deux
 * @param {Scope} scope
 * @returns {Hit[]}
 */
function matchPatterns(text, doubled, scope) {
  /** @type {Hit[]} */
  const hits = [];
  for (const { entry, re } of PATTERN_RULES) {
    if ((doubled && entry.strictDoubles) || (scope === "name" && entry.wholeMessage) || !re.test(text)) continue;
    hits.push({
      layer: "pattern",
      id: entry.id,
      termOrPattern: entry.pattern,
      weight: entry.weight,
      category: entry.category,
      gated: false,
    });
  }
  return hits;
}

/**
 * Teste le texte d'origine puis ses variantes normalisées, et garde la
 * correspondance la plus forte pour chaque entrée. Les règles que
 * l'utilisateur a ignorées sont retirées, et celles qui ne valent que pour un
 * message entier quand le texte est un nom.
 * @param {string} text
 * @param {readonly TermRule[]} termRules
 * @param {ReadonlySet<string>} muted
 * @param {Scope} scope
 */
function collectHits(text, termRules, muted, scope) {
  /** @type {Map<string, Hit>} */
  const best = new Map();
  // Le texte d'origine est lu avec les graphies arabes des règles.
  const origin = plainArabic(text);
  const variants = textVariants(text).filter((v) => v.text !== origin);
  [{ text: origin, doubled: false }, ...variants].forEach(({ text: variant, doubled }, i) => {
    for (const hit of [...matchTerms(variant, termRules, doubled), ...matchPatterns(variant, doubled, scope)]) {
      if (i > 0) hit.via ??= "norm";
      const previous = best.get(hit.id);
      if (!previous || hit.weight > previous.weight) best.set(hit.id, hit);
    }
  });
  const hits = [...best.values()].filter((h) => !muted.has(h.id));
  // Certains mots ambigus ("nègre" littéraire, "raton" laveur) ne comptent
  // que si une autre règle d'attaque a joué dans le même texte, même d'un
  // filtre coupé. Un juron ne suffit pas, ni une règle ignorée.
  const hasCompanion = hits.some((h) => !h.gated && h.category !== "profanity");
  return hits.filter((h) => !h.gated || hasCompanion);
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
 * Toutes les listes s'appliquent à tous les textes, quelle que soit leur langue.
 * @param {object} input
 * @param {string} input.text
 * @param {Sensitivity} [input.sensitivity]
 * @param {readonly Category[]} [input.categories] filtres activés, ceux par défaut sinon
 * @param {readonly string[]} [input.customTerms] mots à toujours masquer, choisis par l'utilisateur
 * @param {readonly string[]} [input.mutedRules] règles que l'utilisateur a désactivées pour lui
 * @param {Scope} [input.scope] "name" pour un nom d'affichage : les règles wholeMessage n'y jouent pas
 * @returns {Result}
 */
export function scoreText({
  text,
  sensitivity = "medium",
  categories = DEFAULT_CATEGORIES,
  customTerms = [],
  mutedRules = [],
  scope = "message",
}) {
  const empty = !text.trim();
  const enabled = new Set([...categories, "custom"]);
  const rules = customTerms.length ? [...TERM_RULES, ...customRules(customTerms)] : TERM_RULES;
  const hits = empty ? [] : collectHits(text, rules, new Set(mutedRules), scope).filter((h) => enabled.has(h.category));
  const total = hits.reduce((sum, h) => sum + h.weight, 0);
  // Arrondi avant les seuils : 0,3 + 0,6 donne 0,8999… en virgule flottante,
  // et doit compter comme 0,9, le score affiché.
  const score = Math.round(Math.min(1, total) * 1000) / 1000;
  const action = actionOf(score, sensitivity);
  return {
    match: action !== "pass",
    action,
    score,
    categories: rankCategories(hits),
    matches: hits.map(({ layer, id, termOrPattern, weight }) => ({ layer, id, termOrPattern, weight })),
    reasonLocal: empty
      ? "empty"
      : hits.map((h) => `${h.layer}:${h.id}${h.via ? `~${h.via}` : ""}`).join(", ") || "no_hit",
    version: VERSION,
  };
}
