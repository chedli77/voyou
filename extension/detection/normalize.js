/**
 * Défait les déguisements courants d'un texte haineux (n1gg3r, n.i.g.g.e.r,
 * 𝐬𝐚𝐥𝐞, s̶a̶l̶e̶, niiiigger...) pour que les listes les reconnaissent.
 *
 * On ne remplace jamais le texte d'origine : textVariants() renvoie des
 * versions en plus, que le détecteur teste aussi. Une normalisation ne peut
 * donc qu'ajouter des correspondances, jamais en faire perdre.
 * Les accents sont conservés, les listes françaises en dépendent.
 */

// Tous les caractères invisibles selon Unicode (Default_Ignorable_Code_Point) :
// espaces sans largeur, trait d'union conditionnel, marques bidi, sélecteurs
// de variante, étiquettes...
const INVISIBLE = /\p{Default_Ignorable_Code_Point}/gu;

// Diacritiques combinants restés seuls après NFKC, qui a déjà composé les
// accents (é, ç, ã) : texte barré, souligné ou encerclé des générateurs de
// texte stylé, zalgo. Les signes des autres écritures ne sont pas touchés.
const COMBINING_MARKS = /[\u0300-\u036F\u0483-\u0489\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/g;

// Voyelles écrites de l'arabe (harakat) et tatweel, qu'on glisse dans un mot pour le déguiser.
const ARABIC_MARKS = /[\u0640\u064B-\u065F\u0670]/g;

// Graphies arabes courantes ramenées à une seule : l'alif avec hamza ou
// madda, ى pour ي en fin de mot, le kaf persan. Le ی persan reste distinct :
// en persan, « یا » veut dire « ou ».
/** @type {Record<string, string>} */
const ARABIC_SPELLINGS = { أ: "ا", إ: "ا", آ: "ا", ٱ: "ا", ى: "ي", ک: "ك" };
const ARABIC_SPELLING_RE = new RegExp(`[${Object.keys(ARABIC_SPELLINGS).join("")}]`, "g");

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
// Tout ce que mapLeet remplace, tiré des tables : un mot qui n'en contient aucun reste tel quel.
const LEET_RE = new RegExp(`[1${[...Object.keys(LEET_DIGITS), ...Object.keys(LEET_SYMBOLS)].join("")}]`);

// L'apostrophe reste dans le mot : « t'3s » doit donner « t'es ».
const TOKEN_RE = /[\p{L}\p{M}\p{N}@$€!|'‘’]+/gu;
const LETTER_RE = /\p{L}/gu;

// Au moins 3 caractères isolés séparés par le même séparateur : "n.i.g", "s a l e".
const SPACED_RE = /(?<![\p{L}\p{N}])[\p{L}\p{N}]([ .\-_·•*+~/])[\p{L}\p{N}](?:\1[\p{L}\p{N}])+(?![\p{L}\p{N}])/gu;

const STRETCHED_RE = /(\p{L})\1{2,}/gu;

/**
 * Ramène les graphies arabes courantes à une seule. Le détecteur l'applique
 * aussi aux règles, pour que le texte et les listes s'écrivent pareil.
 * @param {string} text
 */
export function unifyArabic(text) {
  return text.replace(ARABIC_SPELLING_RE, (c) => ARABIC_SPELLINGS[c]);
}

/**
 * Le texte d'origine tel que les règles arabes l'écrivent : sans voyelles
 * écrites ni tatweel, graphies unifiées. Une exclusion (« انا ارجع ») doit se
 * lire même quand le texte écrit « أنا ». Les autres écritures ne changent pas.
 * @param {string} text
 */
export function plainArabic(text) {
  return unifyArabic(text.replace(ARABIC_MARKS, ""));
}

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
 * qu'au milieu d'un mot, pour ne pas toucher aux `@mentions` ni à la ponctuation.
 * @param {string} text
 * @param {"i" | "l"} one lettre à mettre à la place du chiffre 1
 */
function mapLeet(text, one) {
  return text.replace(TOKEN_RE, (word) => {
    if (!LEET_RE.test(word) || (word.match(LETTER_RE) ?? []).length < 2) return word;
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
 * @typedef {object} Variant
 * @property {string} text
 * @property {boolean} doubled seules les lettres étirées réduites à deux donnent ce texte
 *   (« cooon » lu « coon ») : c'est la seule variante qui fabrique des lettres doublées
 */

/**
 * @param {string} text texte d'origine
 * @returns {Variant[]} variantes distinctes du texte d'origine (souvent aucune)
 */
export function textVariants(text) {
  // Les invisibles sont retirés avant NFKC, qui recompose alors une lettre
  // et son accent qu'ils séparaient. NFKC ramène les lettres stylisées (gras
  // mathématique, pleine chasse) à l'alphabet normal.
  const clean = text.replace(INVISIBLE, "").normalize("NFKC").replace(COMBINING_MARKS, "").replace(ARABIC_MARKS, "");
  // Les sosies sont remplacés après le recollage des lettres espacées : dans
  // « n і g g е r », chaque lettre cyrillique isolée est un mot sans lettre latine.
  const base = mapHomoglyphs(joinSpacedLetters(unifyArabic(clean)));
  const withI = mapLeet(base, "i");
  // Lettres étirées réduites à une ("niiiigger") et à deux ("connnnard").
  // Les doubles ne sont jamais touchées : "Niger" ne devient pas une insulte.
  /** @type {Map<string, boolean>} */
  const variants = new Map([
    [withI, false],
    [withI.replace(STRETCHED_RE, "$1"), false],
  ]);
  const twoLetters = withI.replace(STRETCHED_RE, "$1$1");
  if (!variants.has(twoLetters)) variants.set(twoLetters, true);
  if (base.includes("1")) variants.set(mapLeet(base, "l"), false);
  variants.delete(text);
  return [...variants].map(([variant, doubled]) => ({ text: variant, doubled }));
}
