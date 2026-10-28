/**
 * Évalue le détecteur sur les cas de seed.json (sensibilité moyenne par défaut)
 * et vérifie que les listes sont bien formées.
 * Sort en erreur (code 1) au moindre écart, pour bloquer le packaging et la CI.
 *
 * Usage : npm run eval
 */
import blocklist from "../../extension/detection/lists/blocklist.json" with { type: "json" };
import patterns from "../../extension/detection/lists/patterns.json" with { type: "json" };
import { scoreText } from "../../extension/detection/score.js";
import seed from "./seed.json" with { type: "json" };

/**
 * @typedef {object} Case
 * @property {string} id
 * @property {import("../../extension/detection/score.js").Lang} lang
 * @property {string} text
 * @property {import("../../extension/detection/score.js").Action} expectAction
 * @property {string[]} expectCategories
 * @property {import("../../extension/detection/score.js").Sensitivity} [sensitivity]
 */
const cases = /** @type {Case[]} */ (seed.cases);
const LANGS = new Set(["fr", "en", "any"]);

/** @returns {string[]} */
function checkLists() {
  const problems = [];
  const ids = new Set();
  for (const entry of [...blocklist.entries, ...patterns.entries]) {
    if (ids.has(entry.id)) problems.push(`id en double : ${entry.id}`);
    ids.add(entry.id);
    if (!LANGS.has(entry.lang)) problems.push(`${entry.id} : langue inconnue "${entry.lang}"`);
    if (!(entry.weight > 0 && entry.weight <= 1)) problems.push(`${entry.id} : poids hors de ]0, 1]`);
    if (!entry.category) problems.push(`${entry.id} : catégorie manquante`);
  }
  for (const entry of blocklist.entries) {
    if (!entry.terms?.length) problems.push(`${entry.id} : aucun terme`);
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
    const r = scoreText({ text: c.text, lang: c.lang, sensitivity: c.sensitivity });
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
const expectHidden = cases.filter((c) => c.expectAction !== "pass");
const missed = failures.filter((f) => expectHidden.some((c) => c.id === f.id && f.problem.includes("obtenu pass")));
const falsePositives = failures.filter((f) => f.problem.startsWith("attendu pass"));

for (const p of listProblems) console.log(`liste  ${p}`);
for (const f of failures) console.log(`cas    ${f.id} : ${f.problem}`);
console.log(
  `Eval : ${cases.length - failures.length}/${cases.length} cas OK, ` +
    `${falsePositives.length} faux positif(s), ${missed.length} raté(s), ${listProblems.length} problème(s) de liste`,
);
if (failures.length || listProblems.length) process.exitCode = 1;
