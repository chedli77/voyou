/**
 * Tests unitaires de score.js : la compilation des motifs, les mots perso et
 * les seuils de sensibilité. Ils ne dépendent pas du détail des listes, que
 * les cas de tests/detection/cases couvrent : les seuils sont vérifiés par
 * rapport au score obtenu, quel qu'il soit. Les textes sont inventés.
 *
 * Usage : npm run test:unit
 */
import assert from "node:assert/strict";
import test from "node:test";
import { CATEGORIES } from "../../extension/detection/categories.js";
import { LISTS, compilePattern, scoreText } from "../../extension/detection/score.js";
import { SENSITIVITIES } from "../../extension/settings.js";

/**
 * @param {string} pattern
 * @param {string} [flags]
 */
const compile = (pattern, flags = "i") =>
  compilePattern({ id: "test", category: "insult", weight: 1, note: "", pattern, flags });

/**
 * Le mot perso joue-t-il sur ce texte ?
 * @param {string} text
 * @param {string} word
 */
const hidesWith = (text, word) => scoreText({ text, customTerms: [word] }).matches.some((m) => m.id === "custom-0");

test("\\b connaît les lettres accentuées", () => {
  const re = compile("\\bété\\b");
  assert.ok(re.test("un été chaud"));
  assert.ok(!re.test("un étéx"));
  assert.ok(!re.test("préété"));
});

test("\\b suivi d'un regard en arrière ouvre un mot", () => {
  const re = compile("\\b(?<!ele\\s)vai");
  assert.ok(re.test("tu vai"));
  assert.ok(!re.test("ele vai"));
  assert.ok(!re.test("devai"));
  assert.ok(compile("\\b(?<=a\\s)(?<![(]x)vai").test("a vai"));
  assert.ok(compile("vai\\b(?<=i)").test("vai bem"));
  assert.ok(!compile("vai\\b(?<=i)").test("vaia"));
});

test("\\w connaît toutes les lettres, hors classe et dans une classe", () => {
  assert.ok(compile("^\\w+$").test("tête"));
  assert.ok(compile("^\\w+$").test("زنجي"));
  assert.ok(compile("^[\\w-]+$").test("peut-être"));
  assert.ok(!compile("^[^\\w]+$").test("é"));
});

test("une apostrophe des motifs accepte ses formes typographiques", () => {
  const re = compile("^t'es$");
  for (const text of ["t'es", "t’es", "t‘es", "tʼes"]) assert.ok(re.test(text), text);
  assert.ok(compile("^t[’]es$").test("t'es"));
  assert.ok(!compile("^[^']+$").test("l’arbre"));
});

test("une barre oblique inverse échappée n'est pas une frontière de mot", () => {
  assert.ok(compile("^a\\\\b$").test("a\\b"));
});

test("les lettres arabes des motifs sont unifiées comme celles du texte", () => {
  assert.ok(compile("^إلى$").test("الي"));
});

test("un mot perso accepte toutes les apostrophes", () => {
  for (const text of ["c'est nul", "c’est nul", "c‘est nul", "cʼest nul"]) {
    assert.ok(hidesWith(text, "c'est nul"), text);
    assert.ok(hidesWith(text, "c’est nul"), text);
  }
});

test("les mots d'une expression perso peuvent être séparés par des blancs, un tiret ou un _", () => {
  for (const text of [
    "un gros mot",
    "un gros  mot",
    "un gros\nmot",
    "un gros-mot",
    "un gros\u2010mot",
    "#gros_mot",
    "un grosmot",
  ]) {
    assert.ok(hidesWith(text, "gros mot"), JSON.stringify(text));
  }
  assert.ok(!hidesWith("gros, mot", "gros mot"));
  assert.ok(hidesWith("un gros mot", "gros-mot"));
});

test("un mot perso fait de tirets reste un mot entier", () => {
  assert.ok(!hidesWith("Bravo ! 👏 Merci .", "--"));
  assert.ok(hidesWith("un mot -- un autre", "--"));
});

test("un mot perso est un mot entier, même collé à un emoji", () => {
  assert.ok(hidesWith("👉wokiste👈", "wokiste"));
  assert.ok(!hidesWith("antiwokiste", "wokiste"));
});

test("un mot perso masqué compte en entier, à toutes les sensibilités", () => {
  for (const sensitivity of SENSITIVITIES) {
    const r = scoreText({ text: "encore v*ldemort", customTerms: ["voldemort"], sensitivity });
    assert.equal(r.action, "collapse", sensitivity);
    assert.equal(r.reasonLocal, "blocklist:custom-0~masked");
  }
});

test("une expression perso collée et masquée est reconnue", () => {
  assert.ok(hidesWith("encore un gr*smot", "gros mot"));
});

test("un mot perso arabe est reconnu quelle que soit sa graphie", () => {
  assert.ok(hidesWith("انت احمق", "أحمق"));
  assert.ok(hidesWith("انت أحمق", "احمق"));
});

// Les seuils de docs/detection.md.
/** @type {Record<string, { blur: number, collapse: number }>} */
const THRESHOLDS = {
  low: { blur: 0.7, collapse: 0.9 },
  medium: { blur: 0.5, collapse: 0.75 },
  high: { blur: 0.35, collapse: 0.6 },
};

test("chaque sensibilité des réglages a ses seuils documentés", () => {
  assert.deepEqual(Object.keys(THRESHOLDS).sort(), [...SENSITIVITIES].sort());
});

test("l'action suit le score affiché et les seuils de chaque sensibilité", () => {
  const all = CATEGORIES.map((c) => c.id);
  // Des scores de 0,3 à 1, dont plusieurs tombent pile sur un seuil.
  // « p*tain, what a retard » additionne 0,3 et 0,6 : 0,8999… en virgule flottante.
  const texts = [
    { text: "p*tain", categories: all },
    { text: "what a r*tarded take" },
    { text: "t'es un c*nnard" },
    { text: "putain", categories: all },
    { text: "un b*ugnoule" },
    { text: "what a retard" },
    { text: "encore un abruti" },
    { text: "que gilipollas" },
    { text: "quel tocard" },
    { text: "kahba" },
    { text: "bamboula" },
    { text: "p*tain, what a retard", categories: all },
    { text: "sale bougnoule" },
  ];
  for (const sensitivity of SENSITIVITIES) {
    const t = THRESHOLDS[sensitivity];
    for (const { text, categories } of texts) {
      const r = scoreText({ text, categories, sensitivity });
      const expected = r.score >= t.collapse ? "collapse" : r.score >= t.blur ? "blur" : "pass";
      assert.equal(r.action, expected, `« ${text} » (${r.score}) en ${sensitivity}`);
      assert.equal(r.match, expected !== "pass");
    }
  }
});

test("un nom d'affichage ne passe pas par les règles qui valent pour un message entier", () => {
  const whole = new Set(
    Object.values(LISTS)
      .flatMap((list) => list.patterns)
      .filter((p) => p.wholeMessage)
      .map((p) => p.id),
  );
  assert.ok(whole.size, "aucune règle wholeMessage");
  let skipped = 0;
  for (const text of [
    "\u{1F412}",
    "\u{1F98D}\u{1F98D}",
    "Marc, homo",
    "ta gueule, homo",
    "sale \u{1F412}",
    "Sale PD",
  ]) {
    const message = scoreText({ text }).matches.map((m) => m.id);
    const name = scoreText({ text, scope: "name" }).matches.map((m) => m.id);
    assert.deepEqual(
      name,
      message.filter((id) => !whole.has(id)),
      text,
    );
    if (name.length < message.length) skipped++;
  }
  assert.ok(skipped, "aucun texte ne touche une règle wholeMessage");
  assert.deepEqual(scoreText({ text: "Marc, homo", scope: "message" }), scoreText({ text: "Marc, homo" }));
});
