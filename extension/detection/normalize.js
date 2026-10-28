/**
 * Défait les déguisements courants d'un texte haineux (n1gg3r, n.i.g.g.e.r,
 * 𝐬𝐚𝐥𝐞, niiiigger...) pour que les listes les reconnaissent.
 *
 * On ne remplace jamais le texte d'origine : textVariants() renvoie des
 * versions en plus, que le détecteur teste aussi. Une normalisation ne peut
 * donc qu'ajouter des correspondances, jamais en faire perdre.
 * Les accents sont conservés, les listes françaises en dépendent.
 */

// Voyelles écrites de l'arabe (harakat) et tatweel, qu'on glisse dans un mot pour le déguiser.
const ARABIC_MARKS = /[\u0640\u064B-\u065F\u0670]/g;

// Espaces sans largeur, trait d'union conditionnel, sélecteurs de variante, etc.
const INVISIBLE =
  /[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u3164\uFE00-\uFE0F\uFEFF]/g;

// Lettres cyrilliques et grecques qui ressemblent à des lettres latines.
/** @type {Record<string, string>} */
const HOMOGLYPHS = {
  а: "a",
  в: "b",
  е: "e",
  ё: "e",
  і: "i",
  ї: "i",
  ј: "j",
  к: "k",
  м: "m",
  н: "h",
  о: "o",
  р: "p",
  с: "c",
  т: "t",
  у: "y",
  х: "x",
  ѕ: "s",
  ԁ: "d",
  ԛ: "q",
  ԝ: "w",
  ɡ: "g",
  А: "a",
  В: "b",
  Е: "e",
  К: "k",
  М: "m",
  Н: "h",
  О: "o",
  Р: "p",
  С: "c",
  Т: "t",
  Х: "x",
  І: "i",
  Ј: "j",
  Ѕ: "s",
  α: "a",
  ε: "e",
  ι: "i",
  κ: "k",
  ν: "v",
  ο: "o",
  ρ: "p",
  τ: "t",
  υ: "u",
  Α: "a",
  Β: "b",
  Ε: "e",
  Ζ: "z",
  Η: "h",
  Ι: "i",
  Κ: "k",
  Μ: "m",
  Ν: "n",
  Ο: "o",
  Ρ: "p",
  Τ: "t",
  Υ: "y",
  Χ: "x",
};
const HOMOGLYPH_RE = new RegExp(`[${Object.keys(HOMOGLYPHS).join("")}]`, "gu");
const LATIN_RE = /[a-zA-Z\u00C0-\u024F]/;

// Le chiffre 1 est traité à part : il peut remplacer un i ou un l.
/** @type {Record<string, string>} */
const LEET_DIGITS = { 0: "o", 3: "e", 4: "a", 5: "s", 7: "t", 9: "g" };
/** @type {Record<string, string>} */
const LEET_SYMBOLS = { "@": "a", $: "s", "€": "e", "!": "i", "|": "i" };

// L'apostrophe reste dans le mot : « t'3s » doit donner « t'es ».
const TOKEN_RE = /[\p{L}\p{M}\p{N}@$€!|'’]+/gu;
const LETTER_RE = /\p{L}/gu;

// Au moins 3 caractères isolés séparés par le même séparateur : "n.i.g", "s a l e".
const SPACED_RE = /(?<![\p{L}\p{N}])[\p{L}\p{N}]([ .\-_·•*+~/])[\p{L}\p{N}](?:\1[\p{L}\p{N}])+(?![\p{L}\p{N}])/gu;

const STRETCHED_RE = /(\p{L})\1{2,}/gu;

/**
 * Remplace les sosies cyrilliques ou grecs, seulement dans les mots qui
 * contiennent aussi des lettres latines : un vrai mot russe reste intact.
 * @param {string} text
 */
function mapHomoglyphs(text) {
  return text.replace(TOKEN_RE, (word) =>
    LATIN_RE.test(word) ? word.replace(HOMOGLYPH_RE, (c) => HOMOGLYPHS[c]) : word,
  );
}

/** @param {string} text */
function joinSpacedLetters(text) {
  return text.replace(SPACED_RE, (run, separator) => run.split(separator).join(""));
}

/**
 * Remplace le leetspeak dans les mots d'au moins deux lettres, ce qui laisse
 * "4x4", "h24" ou "2e" tranquilles. Les symboles (@, $, !) ne sont remplacés
 * qu'au milieu d'un mot, pour ne pas toucher aux @mentions ni à la ponctuation.
 * @param {string} text
 * @param {"i" | "l"} one lettre à mettre à la place du chiffre 1
 */
function mapLeet(text, one) {
  return text.replace(TOKEN_RE, (word) => {
    if ((word.match(LETTER_RE) ?? []).length < 2) return word;
    const chars = [...word];
    return chars
      .map((c, i) => {
        if (c === "1") return one;
        if (LEET_DIGITS[c]) return LEET_DIGITS[c];
        if (LEET_SYMBOLS[c] && i > 0 && i < chars.length - 1) return LEET_SYMBOLS[c];
        return c;
      })
      .join("");
  });
}

/**
 * @param {string} text texte d'origine
 * @returns {string[]} variantes distinctes du texte d'origine (souvent aucune)
 */
export function textVariants(text) {
  // NFKC ramène les lettres stylisées (gras mathématique, pleine chasse) à l'alphabet normal.
  const base = joinSpacedLetters(
    mapHomoglyphs(text.normalize("NFKC").replace(INVISIBLE, "").replace(ARABIC_MARKS, "")),
  );
  const withI = mapLeet(base, "i");
  const variants = new Set([
    withI,
    // Lettres étirées réduites à une ("niiiigger") et à deux ("connnnard").
    // Les doubles ne sont jamais touchées : "Niger" ne devient pas une insulte.
    withI.replace(STRETCHED_RE, "$1"),
    withI.replace(STRETCHED_RE, "$1$1"),
  ]);
  if (base.includes("1")) variants.add(mapLeet(base, "l"));
  variants.delete(text);
  return [...variants];
}
