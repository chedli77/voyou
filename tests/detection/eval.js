/**
 * Évalue le détecteur sur les cas de tests/detection/cases/*.json (un fichier
 * par langue, plus les filtres et les textes déguisés), vérifie que les
 * listes sont bien formées et que chaque règle est déclenchée par au moins un
 * cas masqué. Sort en erreur (code 1) au moindre écart, pour bloquer le
 * packaging et la CI.
 *
 * Usage : npm run eval
 */
import { readFileSync, readdirSync } from "node:fs";
import { CATEGORIES } from "../../extension/detection/categories.js";
import { LISTS, scoreText } from "../../extension/detection/score.js";
import { SENSITIVITIES, sanitizeSettings } from "../../extension/settings.js";

/**
 * @typedef {import("../../extension/detection/score.js").Category} Category
 *
 * @typedef {object} Case
 * @property {string} id
 * @property {string} lang langue du texte, pour le rangement : toutes les listes s'appliquent à tous les textes
 * @property {string} text
 * @property {import("../../extension/detection/score.js").Action} expectAction
 * @property {Category[]} expectCategories
 * @property {string[]} [expectRules] règles qui doivent jouer, quelle que soit l'action
 * @property {import("../../extension/detection/score.js").Sensitivity} [sensitivity]
 * @property {import("../../extension/detection/score.js").Scope} [scope] "name" pour un nom d'affichage
 * @property {Category[]} [filters] filtres activés pour ce cas, ceux par défaut sinon
 * @property {string[]} [customTerms] mots perso de l'utilisateur
 * @property {string[]} [mutedRules] règles désactivées par l'utilisateur
 */
const CASES_DIR = new URL("./cases/", import.meta.url);
const cases = readdirSync(CASES_DIR)
  .filter((name) => name.endsWith(".json"))
  .flatMap(
    (name) => /** @type {{ cases: Case[] }} */ (JSON.parse(readFileSync(new URL(name, CASES_DIR), "utf8"))).cases,
  );
/** @type {Set<string>} */
const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));
/** @type {Set<string>} */
const SENSITIVITY_IDS = new Set(SENSITIVITIES);
/** @type {Set<string>} */
const SCOPES = new Set(["message", "name"]);
/** @type {Set<string>} */
const RULE_IDS = new Set(Object.values(LISTS).flatMap((list) => [...list.terms, ...list.patterns].map((e) => e.id)));

const COMMON_FIELDS = ["id", "category", "weight", "note", "strictDoubles"];
const TERM_FIELDS = new Set([...COMMON_FIELDS, "terms", "requireAttackCompanion"]);
const PATTERN_FIELDS = new Set([...COMMON_FIELDS, "pattern", "flags", "wholeMessage"]);
const BOOLEAN_FIELDS = new Set(["strictDoubles", "requireAttackCompanion", "wholeMessage"]);
// Ni g ni y : la regex garderait sa position d'un texte à l'autre. Un flag
// inconnu ou en double empêche déjà score.js de se charger.
const FLAGS_RE = /^[imsu]*$/;
// Un regard en arrière positif en tête d'alternative se teste à chaque
// position du texte : le moteur ne peut plus sauter jusqu'au premier mot du
// motif (60 µs au lieu de 0,1 sur un tweet). La forme négative, ou le mot
// d'abord, ne coûte rien.
const LEADING_LOOKBEHIND_RE = /(?:^|[|(]|\(\?:)\(\?<=/;

/** @returns {string[]} */
function checkLists() {
  const problems = [];
  const ids = new Set();
  /** @type {Map<string, string>} */
  const termOwners = new Map();
  for (const [lang, list] of Object.entries(LISTS)) {
    for (const [entry, fields] of [
      ...list.terms.map((e) => /** @type {const} */ ([e, TERM_FIELDS])),
      ...list.patterns.map((e) => /** @type {const} */ ([e, PATTERN_FIELDS])),
    ]) {
      const where = `${lang}/${entry.id}`;
      if (ids.has(entry.id)) problems.push(`${where} : id en double`);
      ids.add(entry.id);
      // « Ce n'est pas de la haine » enregistre l'id de la règle : un id que les
      // réglages ne gardent pas, ou réservé aux mots perso, rendrait le bouton sans effet.
      if (!sanitizeSettings({ mutedRules: [entry.id] }).mutedRules.length || entry.id.startsWith("custom-")) {
        problems.push(`${where} : id refusé par les réglages (a-z, 0-9 et -, sans le préfixe custom-)`);
      }
      if (!CATEGORY_IDS.has(entry.category)) problems.push(`${where} : catégorie inconnue "${entry.category}"`);
      if (!(entry.weight > 0 && entry.weight <= 1)) problems.push(`${where} : poids hors de ]0, 1]`);
      if (!entry.note) problems.push(`${where} : note manquante`);
      if ("flags" in entry && !FLAGS_RE.test(entry.flags)) {
        problems.push(`${where} : flags « ${entry.flags} » invalides`);
      }
      if ("pattern" in entry && LEADING_LOOKBEHIND_RE.test(entry.pattern)) {
        problems.push(`${where} : (?<= en tête d'alternative, lent sur tout le texte : écris (?<!…) ou le mot d'abord`);
      }
      for (const [field, value] of Object.entries(entry)) {
        if (!fields.has(field)) {
          problems.push(`${where} : champ inconnu « ${field} »`);
        } else if (BOOLEAN_FIELDS.has(field) && typeof value !== "boolean") {
          problems.push(`${where} : ${field} doit valoir true ou false`);
        }
      }
    }
    for (const entry of list.terms) {
      if (!entry.terms.length) problems.push(`${lang}/${entry.id} : aucun terme`);
      // Un même mot dans deux règles compterait deux fois.
      for (const term of entry.terms) {
        const key = term.toLowerCase();
        const owner = termOwners.get(key);
        if (owner && owner !== entry.id) problems.push(`${lang}/${entry.id} : « ${term} » est déjà dans ${owner}`);
        termOwners.set(key, entry.id);
      }
      if (new Set(entry.terms).size !== entry.terms.length) problems.push(`${lang}/${entry.id} : terme en double`);
    }
  }
  return problems;
}

/**
 * Un champ mal écrit retomberait en silence sur la valeur par défaut.
 * @param {Case} c
 * @returns {string | null}
 */
function caseProblem(c) {
  if (c.sensitivity !== undefined && !SENSITIVITY_IDS.has(c.sensitivity)) {
    return `sensibilité inconnue « ${c.sensitivity} »`;
  }
  if (c.scope !== undefined && !SCOPES.has(c.scope)) return `portée inconnue « ${c.scope} »`;
  const filter = c.filters?.find((f) => !CATEGORY_IDS.has(f));
  if (filter) return `filtre inconnu « ${filter} »`;
  const rule = [...(c.expectRules ?? []), ...(c.mutedRules ?? [])].find((id) => !RULE_IDS.has(id));
  if (rule) return `règle inconnue « ${rule} »`;
  return null;
}

/** @returns {{ failures: { id: string, problem: string }[], covered: Set<string> }} */
function runCases() {
  const failures = [];
  /** @type {Set<string>} règles déclenchées par au moins un cas masqué */
  const covered = new Set();
  const ids = new Set();
  for (const c of cases) {
    if (ids.has(c.id)) failures.push({ id: c.id, problem: "id de cas en double" });
    ids.add(c.id);
    const problem = caseProblem(c);
    if (problem) {
      failures.push({ id: c.id, problem });
      continue;
    }
    // Comme dans l'extension, toutes les listes s'appliquent à tous les textes,
    // ce qui fait apparaître les faux positifs d'une langue sur une autre.
    const r = scoreText({
      text: c.text,
      sensitivity: c.sensitivity,
      categories: c.filters,
      customTerms: c.customTerms,
      mutedRules: c.mutedRules,
      scope: c.scope,
    });
    const fired = r.matches.map((m) => m.id);
    if (c.expectAction !== "pass") for (const id of fired) covered.add(id);
    if (r.action !== c.expectAction) {
      failures.push({
        id: c.id,
        problem: `attendu ${c.expectAction}, obtenu ${r.action} (${r.score}, ${r.reasonLocal})`,
      });
    } else if (r.match && !c.expectCategories.every((cat) => r.categories.includes(cat))) {
      failures.push({ id: c.id, problem: `catégories attendues ${c.expectCategories}, obtenues ${r.categories}` });
    } else if (c.expectRules && !c.expectRules.every((id) => fired.includes(id))) {
      failures.push({ id: c.id, problem: `règles attendues ${c.expectRules}, obtenues ${fired} (${r.reasonLocal})` });
    }
  }
  return { failures, covered };
}

/**
 * Règles qu'aucun cas masqué ne déclenche, par liste : une faute de frappe
 * dans leurs mots passerait inaperçue.
 * @param {Set<string>} covered
 */
function uncoveredRules(covered) {
  return Object.entries(LISTS)
    .map(([lang, list]) => ({
      lang,
      ids: [...list.terms, ...list.patterns].map((e) => e.id).filter((id) => !covered.has(id)),
    }))
    .filter(({ ids }) => ids.length);
}

const listProblems = checkLists();
const { failures, covered } = runCases();
const uncovered = uncoveredRules(covered);
const uncoveredCount = uncovered.reduce((sum, { ids }) => sum + ids.length, 0);
const byId = new Map(cases.map((c) => [c.id, c]));
const missed = failures.filter((f) => byId.get(f.id)?.expectAction !== "pass" && f.problem.includes("obtenu pass"));
const falsePositives = failures.filter((f) => f.problem.startsWith("attendu pass"));

for (const p of listProblems) console.log(`liste  ${p}`);
for (const { lang, ids } of uncovered) console.log(`liste  ${lang} : aucun cas masqué ne déclenche ${ids.join(", ")}`);
for (const f of failures) console.log(`cas    ${f.id} : ${f.problem}`);
console.log(
  `Eval : ${cases.length - failures.length}/${cases.length} cas OK, ` +
    `${falsePositives.length} faux positif(s), ${missed.length} raté(s), ${listProblems.length} problème(s) de liste, ` +
    `${uncoveredCount} règle(s) sans cas masqué`,
);
if (failures.length || listProblems.length || uncoveredCount) process.exitCode = 1;
