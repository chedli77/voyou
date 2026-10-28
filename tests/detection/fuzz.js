/**
 * Tests de robustesse du détecteur, sur des milliers de textes générés :
 *   aucun texte ne fait planter scoreText ni textVariants ;
 *   le résultat est déterministe et bien formé ;
 *   aucun texte, même long ou piégé, ne prend plus de MAX_MS (protection
 *   contre les expressions régulières qui s'emballent) ;
 *   un message haineux reste détecté quand on le déguise ou qu'on l'entoure
 *   de texte normal.
 *
 * Deux générateurs : un maison, ciblé sur les déguisements courants, et
 * fast-check, qui explore des chaînes Unicode quelconques et réduit tout
 * échec au plus petit texte qui le provoque. Graines fixes : un échec se
 * reproduit.
 * Usage : npm run fuzz
 */
import fc from "fast-check";
import { textVariants } from "../../extension/detection/normalize.js";
import { scoreText } from "../../extension/detection/score.js";

const ITERATIONS = 3000;
const MAX_MS = 150;

// Générateur pseudo-aléatoire mulberry32 : rapide, reproductible.
let seed = 0x5eed;
const random = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
};
/** @template T @param {readonly T[]} items @returns {T} */
const pick = (items) => items[Math.floor(random() * items.length)];

const ALPHABET = [
  ..."abcdefghijklmnopqrstuvwxyzéèêàçùñãõ",
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  ..."0123456789",
  ..." .,;:!?'’-_*#@$€|/\n",
  "​",
  "­",
  "️",
  "а",
  "о",
  "е",
  "𝐬",
  "ｎ",
  "🐒",
  "🙈",
  "🍌",
  "😂",
  "🇫🇷",
  "ع",
  "ب",
];
const BENIGN = ["bonne journée", "the match was great", "qué calor hace", "o jogo foi bom", "merci pour le lien"];
const HATEFUL = ["sale bougnoule", "nobody cares nigger", "vuelve a tu país sudaca", "preto imundo", "t'es qu'un 🐒"];

/** @param {number} length */
const randomText = (length) => Array.from({ length }, () => pick(ALPHABET)).join("");

/** Déguisements qu'un humain applique à la main. */
const DISGUISES = [
  (/** @type {string} */ s) => s.toUpperCase(),
  (/** @type {string} */ s) => s.replace(/o/g, "0").replace(/e/g, "3"),
  (/** @type {string} */ s) => s.replace(/([aeiou])/g, "$1$1$1"),
  (/** @type {string} */ s) => s.split("").join("​"),
];

const failures = [];

/** @param {string} text */
function probe(text) {
  const start = performance.now();
  let result;
  try {
    textVariants(text);
    result = scoreText({ text });
  } catch (error) {
    failures.push(`plantage sur ${JSON.stringify(text.slice(0, 80))} : ${error}`);
    return null;
  }
  // Une pause du moteur (ramasse-miettes, recompilation) peut ralentir un appel
  // isolé : un texte lent est remesuré avant d'être signalé.
  if (performance.now() - start > MAX_MS) {
    const again = performance.now();
    scoreText({ text });
    const elapsed = performance.now() - again;
    if (elapsed > MAX_MS) failures.push(`${Math.round(elapsed)} ms sur ${JSON.stringify(text.slice(0, 80))}`);
  }
  if (!(result.score >= 0 && result.score <= 1) || result.match !== (result.action !== "pass")) {
    failures.push(`résultat incohérent sur ${JSON.stringify(text.slice(0, 80))}`);
  }
  return result;
}

// Le moteur compile puis recompile en code natif les regex lors des premiers
// appels, et en deux versions : textes en Latin-1 et textes avec d'autres
// caractères (emojis, cyrillique, arabe). On mesure après ce préchauffage.
for (let i = 0; i < 50; i++) {
  scoreText({ text: `${randomText(200)} * ${pick(HATEFUL)}` });
  scoreText({ text: `plain latin text ${i} * sale b*ugnoule vuelve a tu país` });
}

for (let i = 0; i < ITERATIONS; i++) {
  const text = randomText(1 + Math.floor(random() * 300));
  const first = probe(text);
  const second = scoreText({ text });
  if (first && JSON.stringify(first) !== JSON.stringify(second))
    failures.push(`non déterministe : ${JSON.stringify(text)}`);
}

// Textes longs et répétitifs : le cas typique d'une regex qui s'emballe.
for (const chunk of ["a ", "sale ", "aaaaaaaaaa", "🐒", "n.i.", "t'es ", "​", "vous êtes des ", "go back "]) {
  probe(chunk.repeat(Math.ceil(4000 / chunk.length)).slice(0, 4000));
}

for (const hateful of HATEFUL) {
  for (let i = 0; i < 20; i++) {
    const text = `${pick(BENIGN)} ${hateful} ${pick(BENIGN)}`;
    if (!probe(text)?.match) failures.push(`haine perdue dans du texte normal : ${JSON.stringify(text)}`);
  }
  for (const disguise of DISGUISES) {
    const text = disguise(hateful);
    if (!probe(text)?.match) failures.push(`haine déguisée non détectée : ${JSON.stringify(text)}`);
  }
}

// Propriétés vérifiées par fast-check sur des chaînes Unicode quelconques.
const unicodeText = fc.string({ unit: "grapheme", maxLength: 400 });
/** @type {[string, fc.IPropertyWithHooks<any>][]} */
const properties = [
  [
    "ne plante jamais et reste cohérent",
    fc.property(unicodeText, (text) => {
      const r = scoreText({ text });
      return r.score >= 0 && r.score <= 1 && r.match === (r.action !== "pass");
    }),
  ],
  [
    "donne toujours le même résultat",
    fc.property(unicodeText, (text) => JSON.stringify(scoreText({ text })) === JSON.stringify(scoreText({ text }))),
  ],
  [
    "une haine reste détectée quel que soit le texte autour",
    fc.property(
      unicodeText,
      fc.constantFrom(...HATEFUL),
      unicodeText,
      (before, hateful, after) => scoreText({ text: `${before}\n${hateful}\n${after}` }).match,
    ),
  ],
  ["ne fabrique jamais plus de quatre variantes", fc.property(unicodeText, (text) => textVariants(text).length <= 4)],
];
for (const [name, property] of properties) {
  const run = fc.check(property, { numRuns: 500, seed: 0x5eed });
  if (run.failed) failures.push(`propriété « ${name} » : contre-exemple ${JSON.stringify(run.counterexample)}`);
}

for (const f of failures.slice(0, 20)) console.log(`fuzz   ${f}`);
console.log(
  `Fuzz : ${failures.length ? `${failures.length} problème(s)` : "aucun problème"} sur ${ITERATIONS} textes aléatoires, ` +
    `${HATEFUL.length * 24} variantes et ${properties.length} propriétés fast-check`,
);
if (failures.length) process.exitCode = 1;
