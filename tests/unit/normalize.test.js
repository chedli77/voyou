/**
 * Tests unitaires de normalize.js : les variantes que le détecteur teste en
 * plus du texte d'origine. Les textes sont inventés.
 *
 * Usage : npm run test:unit
 */
import assert from "node:assert/strict";
import test from "node:test";
import { plainArabic, textVariants, unifyArabic } from "../../extension/detection/normalize.js";

/** @param {string} text */
const texts = (text) => textVariants(text).map((v) => v.text);

test("les diacritiques du texte barré, souligné ou encerclé sont retirés", () => {
  for (const mark of ["\u0336", "\u0332", "\u0338", "\u20DD"]) {
    assert.ok(
      texts([..."sale"].map((c) => c + mark).join("")).includes("sale"),
      `U+${mark.codePointAt(0)?.toString(16)}`,
    );
  }
});

test("les accents sont gardés, et recomposés quand ils arrivent séparés", () => {
  assert.deepEqual(texts("Café crème"), []);
  assert.ok(texts("Cafe\u0301 cre\u0300me").includes("Café crème"));
});

test("tous les caractères invisibles sont retirés", () => {
  for (const invisible of ["\u00AD", "\u200B", "\u2066", "\u180B", "\u{1D173}", "\u{E0020}", "\u{E0100}"]) {
    assert.ok(texts(`boug${invisible}noule`).includes("bougnoule"), `U+${invisible.codePointAt(0)?.toString(16)}`);
  }
});

test("un invisible entre une lettre et son accent ne l'empêche pas d'être recomposé", () => {
  assert.ok(texts("e\u200B\u0301te\u0301").includes("été"));
});

test("des lettres espacées dont certaines sont cyrilliques sont recollées puis remplacées", () => {
  assert.ok(texts("n і g g е r").includes("nigger"));
  assert.ok(texts("с у к а").includes("сука"));
});

test("les graphies arabes courantes sont unifiées, pas le ی persan", () => {
  assert.equal(unifyArabic("أنت إلى آخر ٱلبيت على كلب"), "انت الي اخر البيت علي كلب");
  assert.equal(unifyArabic("کسمک"), "كسمك");
  assert.equal(unifyArabic("مسلمان یا یهودی"), "مسلمان یا یهودی");
  assert.ok(texts("ارجع إلى بلدك").includes("ارجع الي بلدك"));
});

test("la variante qui réduit les lettres étirées à deux est signalée", () => {
  assert.deepEqual(textVariants("t'es trop cooon"), [
    { text: "t'es trop con", doubled: false },
    { text: "t'es trop coon", doubled: true },
  ]);
  assert.ok(textVariants("espèce de connnnard").some((v) => v.text === "espèce de connard" && v.doubled));
});

test("une variante qu'on obtient aussi sans réduire à deux n'est pas signalée", () => {
  assert.deepEqual(textVariants("c00n"), [{ text: "coon", doubled: false }]);
});

test("le leetspeak est traduit, les mots sans chiffre ni symbole restent tels quels", () => {
  assert.ok(texts("n1gg3r").includes("nigger"));
  assert.ok(texts("b0ugn0ule").includes("bougnoule"));
  assert.ok(texts("s@le arabe").includes("sale arabe"));
  assert.deepEqual(texts("bonjour à tous, le match est à 21h !"), []);
});

test("le texte d'origine se lit sans voyelles arabes et avec les graphies unifiées", () => {
  assert.equal(plainArabic("أنَا ارجـع إلى"), "انا ارجع الي");
  assert.equal(plainArabic("Café crème 🐒"), "Café crème 🐒");
});
