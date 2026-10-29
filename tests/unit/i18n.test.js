/**
 * Textes de l'interface : les langues ont les mêmes clés et les mêmes
 * paramètres que le français (t() retomberait sans rien dire sur le français),
 * et le pluriel suit les règles de chaque langue.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { getLocale, pickLocale, plural, setLocale, t } from "../../extension/i18n.js";

/** @typedef {Record<string, { message: string, placeholders?: Record<string, { content: string }> }>} Messages */

const LOCALES_DIR = new URL("../../extension/_locales/", import.meta.url);
/** @type {Record<string, Messages>} */
const locales = Object.fromEntries(
  readdirSync(LOCALES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => [
      entry.name,
      JSON.parse(readFileSync(new URL(`${entry.name}/messages.json`, LOCALES_DIR), "utf8")),
    ]),
);
const { fr } = locales;

test("chaque langue a exactement les clés du français", () => {
  assert.deepEqual(Object.keys(locales).sort(), ["en", "es", "fr", "pt"]);
  for (const [locale, messages] of Object.entries(locales)) {
    assert.deepEqual(Object.keys(messages).sort(), Object.keys(fr).sort(), locale);
  }
});

test("chaque paramètre est en majuscules, déclaré, et au même rang dans toutes les langues", () => {
  for (const [locale, messages] of Object.entries(locales)) {
    for (const [key, { message, placeholders = {} }] of Object.entries(messages)) {
      const where = `${locale}/${key}`;
      const used = [...message.matchAll(/\$(\w+)\$/g)].map(([, name]) => name);
      for (const name of used) assert.match(name, /^[A-Z_]+$/, `${where} : $${name}$ doit être en majuscules`);
      assert.deepEqual(
        [...new Set(used.map((name) => name.toLowerCase()))].sort(),
        Object.keys(placeholders).sort(),
        `${where} : paramètres utilisés et déclarés`,
      );
      for (const { content } of Object.values(placeholders)) assert.match(content, /^\$\d$/, where);
      assert.deepEqual(placeholders, fr[key].placeholders ?? {}, `${where} : mêmes paramètres qu'en français`);
    }
  }
});

test("la langue de X choisit celle de l'interface, l'anglais pour les autres", () => {
  assert.equal(pickLocale("fr-FR"), "fr");
  assert.equal(pickLocale("pt-BR"), "pt");
  assert.equal(pickLocale("es-419"), "es");
  assert.equal(pickLocale("en_GB"), "en");
  assert.equal(pickLocale("de"), "en");
  assert.equal(pickLocale(""), "en");
  assert.equal(pickLocale(undefined), "en");
});

test("t() remplace les paramètres dans l'ordre déclaré", () => {
  setLocale("fr");
  assert.equal(getLocale(), "fr");
  assert.equal(t("allowAccount", "user123"), "Autoriser @user123");
  assert.equal(t("mutedPattern", "Racisme", "anglais"), "Racisme : tournure (anglais)");
  assert.equal(t("panelPage", "3 masqués"), "Sur cette page : 3 masqués");
  setLocale("en");
  assert.equal(t("mutedTerm", "Insults", "mot"), 'Insults: "mot"');
  assert.equal(t("popupStatsEmpty", 7), "Nothing hidden in the last 7 days.");
  assert.equal(t("cle-inconnue"), "cle-inconnue");
});

test("pluriel : 0 au singulier en français et en portugais, au pluriel en anglais et en espagnol", () => {
  /** @type {Record<string, string[]>} forme attendue pour 0, 1 et 2 */
  const forms = {
    fr: ["One", "One", "Many"],
    pt: ["One", "One", "Many"],
    en: ["Many", "One", "Many"],
    es: ["Many", "One", "Many"],
  };
  for (const [locale, expected] of Object.entries(forms)) {
    setLocale(locale);
    for (const [count, form] of expected.entries()) {
      assert.equal(plural("hudCount", count), t(`hudCount${form}`, count), `${locale}, ${count}`);
    }
  }
  setLocale("es");
  assert.equal(plural("hudCount", 0), "0 ocultos");
  setLocale("fr");
  assert.equal(plural("hudCount", 0), "0 masqué");
  assert.equal(plural("popupStatsTotal", 2), "2 messages masqués");
});
