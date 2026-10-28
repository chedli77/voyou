/**
 * Évalue le détecteur sur les cas de tests/detection/cases/*.json (un fichier
 * par langue, plus les filtres et les textes déguisés) et vérifie que les
 * listes sont bien formées. Sort en erreur (code 1) au moindre écart, pour bloquer
 * le packaging et la CI.
 *
 * Usage : npm run eval
 */
import { readFileSync, readdirSync } from "node:fs";
import { CATEGORIES } from "../../extension/detection/categories.js";
import { LISTS, scoreText } from "../../extension/detection/score.js";

/**
 * @typedef {import("../../extension/detection/score.js").Category} Category
 *
 * @typedef {object} Case
 * @property {string} id
 * @property {import("../../extension/detection/score.js").Lang} lang
 * @property {string} text
 * @property {import("../../extension/detection/score.js").Action} expectAction
 * @property {Category[]} expectCategories
 * @property {import("../../extension/detection/score.js").Sensitivity} [sensitivity]
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

/** @returns {string[]} */
function checkLists() {
  const problems = [];
  const ids = new Set();
  /** @type {Map<string, string>} */
  const termOwners = new Map();
  for (const [lang, list] of Object.entries(LISTS)) {
    for (const entry of [...list.terms, ...list.patterns]) {
      const where = `${lang}/${entry.id}`;
      if (ids.has(entry.id)) problems.push(`${where} : id en double`);
      ids.add(entry.id);
      if (!CATEGORY_IDS.has(entry.category)) problems.push(`${where} : catégorie inconnue "${entry.category}"`);
      if (!(entry.weight > 0 && entry.weight <= 1)) problems.push(`${where} : poids hors de ]0, 1]`);
      if (!entry.note) problems.push(`${where} : note manquante`);
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

/** @returns {{ id: string, problem: string }[]} */
function runCases() {
  const failures = [];
  const ids = new Set();
  for (const c of cases) {
    if (ids.has(c.id)) failures.push({ id: c.id, problem: "id de cas en double" });
    ids.add(c.id);
    const r = scoreText({
      text: c.text,
      // Comme dans l'extension : toutes les listes s'appliquent à tous les textes,
      // ce qui fait apparaître les faux positifs d'une langue sur une autre.
      lang: "auto",
      sensitivity: c.sensitivity,
      categories: c.filters,
      customTerms: c.customTerms,
      mutedRules: c.mutedRules,
    });
    if (r.action !== c.expectAction) {
      failures.push({
        id: c.id,
        problem: `attendu ${c.expectAction}, obtenu ${r.action} (${r.score}, ${r.reasonLocal})`,
      });
    } else if (r.match && !c.expectCategories.every((cat) => r.categories.includes(cat))) {
      failures.push({ id: c.id, problem: `catégories attendues ${c.expectCategories}, obtenues ${r.categories}` });
    }
  }
  return failures;
}

const listProblems = checkLists();
const failures = runCases();
const byId = new Map(cases.map((c) => [c.id, c]));
const missed = failures.filter((f) => byId.get(f.id)?.expectAction !== "pass" && f.problem.includes("obtenu pass"));
const falsePositives = failures.filter((f) => f.problem.startsWith("attendu pass"));

for (const p of listProblems) console.log(`liste  ${p}`);
for (const f of failures) console.log(`cas    ${f.id} : ${f.problem}`);
console.log(
  `Eval : ${cases.length - failures.length}/${cases.length} cas OK, ` +
    `${falsePositives.length} faux positif(s), ${missed.length} raté(s), ${listProblems.length} problème(s) de liste`,
);
if (failures.length || listProblems.length) process.exitCode = 1;
