/**
 * Réglages : lecture de ce qui est saisi dans le panneau, et validation de ce
 * qui vient du stockage (types inattendus, données d'une ancienne version).
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_SETTINGS,
  MAX_CUSTOM_TERMS,
  MAX_TERM_LENGTH,
  RULE_ID,
  loadSettings,
  parseHandles,
  parseTerms,
  sanitizeSettings,
  saveSettings,
} from "../../extension/settings.js";

/**
 * Faux chrome.storage.local. Sans chrome.runtime.id, le script est coupé de
 * l'extension, comme après un rechargement.
 * @param {Record<string, unknown>} stored
 * @param {boolean} [alive]
 */
function fakeChrome(stored, alive = true) {
  /** @type {Record<string, unknown>[]} */
  const writes = [];
  const local = {
    /** @param {Record<string, unknown>} defaults */
    get: async (defaults) => ({ ...defaults, ...stored }),
    /** @param {Record<string, unknown>} items */
    set: async (items) => {
      writes.push(items);
    },
  };
  Object.assign(globalThis, { chrome: { runtime: alive ? { id: "voyou" } : {}, storage: { local } } });
  return writes;
}

test("mots perso : un par ligne, en minuscules, espaces réduits, sans doublon", () => {
  assert.deepEqual(parseTerms("  Mot   Perso \nmot perso\n\n\tAutre mot "), ["mot perso", "autre mot"]);
});

test("mots perso : un accent décomposé est recomposé, comme dans le texte de X", () => {
  const decomposed = "café";
  assert.deepEqual(parseTerms(decomposed), ["café"]);
  assert.deepEqual(parseTerms(`café\n${decomposed}`), ["café"]);
});

test("mots perso : les lettres pleine chasse deviennent des lettres courantes", () => {
  assert.deepEqual(parseTerms("ｍｏｔ ｐｅｒｓｏ"), ["mot perso"]);
});

test("mots perso : trop courts, trop longs ou au-delà de la limite, ils sont écartés", () => {
  assert.deepEqual(parseTerms("a\nok"), ["ok"]);
  assert.deepEqual(parseTerms("x".repeat(MAX_TERM_LENGTH)), ["x".repeat(MAX_TERM_LENGTH)]);
  assert.deepEqual(parseTerms("x".repeat(MAX_TERM_LENGTH + 1)), []);
  const many = Array.from({ length: MAX_CUSTOM_TERMS + 5 }, (_, i) => `mot${i}`);
  assert.deepEqual(parseTerms(many.join("\n")), many.slice(0, MAX_CUSTOM_TERMS));
});

test("mots perso : un emoji seul est gardé", () => {
  assert.deepEqual(parseTerms("🐒"), ["🐒"]);
});

test("comptes : sans @, en minuscules, séparés par ligne, espace, virgule ou point-virgule", () => {
  assert.deepEqual(parseHandles("@User123\n@hater99, user_7;  @USER123"), ["user123", "hater99", "user_7"]);
});

test("comptes : un nom impossible sur X est écarté", () => {
  assert.deepEqual(parseHandles("@user123456789012\n@pas-valide\n@\n@ok"), ["ok"]);
});

test("stockage vide : réglages par défaut", () => {
  assert.deepEqual(sanitizeSettings({}), DEFAULT_SETTINGS);
});

test("valeurs d'un mauvais type ou d'une ancienne version : remplacées ou écartées", () => {
  const settings = sanitizeSettings({
    enabled: "non",
    categories: ["racism", "spam", 3, "profanity"],
    sensitivity: "max",
    allowedHandles: "@user123 @hater99",
    customTerms: ["Mot", 42, null, { term: "objet" }],
    mutedRules: ["pat-fr-x", "pat_fr_x", "", 7, "pat-fr-x"],
  });
  assert.deepEqual(settings, {
    enabled: true,
    categories: ["racism", "profanity"],
    sensitivity: "medium",
    allowedHandles: ["user123", "hater99"],
    customTerms: ["mot"],
    mutedRules: ["pat-fr-x"],
  });
  assert.equal(sanitizeSettings({ enabled: false, categories: "racism" }).enabled, false);
  assert.deepEqual(sanitizeSettings({ categories: "racism" }).categories, DEFAULT_SETTINGS.categories);
});

test("identifiant de règle : minuscules, chiffres et tirets, 64 caractères au plus", () => {
  assert.ok(RULE_ID.test("pat-fr-rentrez"));
  assert.ok(RULE_ID.test("x".repeat(64)));
  assert.ok(!RULE_ID.test("pat_fr_x"));
  assert.ok(!RULE_ID.test("Pat-fr"));
  assert.ok(!RULE_ID.test("x".repeat(65)));
});

test("lecture : les valeurs enregistrées passent par la même validation", async () => {
  fakeChrome({ sensitivity: "high", customTerms: ["café"], categories: ["threat", "inconnue"] });
  const settings = await loadSettings();
  assert.equal(settings.sensitivity, "high");
  assert.deepEqual(settings.customTerms, ["café"]);
  assert.deepEqual(settings.categories, ["threat"]);
  assert.equal(settings.enabled, true);
});

test("enregistrement : rien n'est écrit par un script coupé de l'extension", async () => {
  const writes = fakeChrome({});
  await saveSettings({ enabled: false });
  assert.deepEqual(writes, [{ enabled: false }]);
  const orphan = fakeChrome({}, false);
  await saveSettings({ enabled: true });
  assert.deepEqual(orphan, []);
});
