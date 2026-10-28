/**
 * Les filtres proposés à l'utilisateur. Chaque règle des listes appartient à
 * une seule de ces catégories, et ne compte que si sa catégorie est activée.
 * Les libellés sont traduits dans extension/_locales (clés category_<id>).
 * "custom" est réservée aux mots ajoutés par l'utilisateur, toujours actifs.
 */

/**
 * @typedef {"racism" | "hate" | "threat" | "insult" | "profanity" | "custom"} Category
 * @typedef {{ id: Exclude<Category, "custom">, enabledByDefault: boolean }} CategoryInfo
 */

/** @type {CategoryInfo[]} */
export const CATEGORIES = [
  { id: "racism", enabledByDefault: true },
  { id: "hate", enabledByDefault: true },
  { id: "threat", enabledByDefault: true },
  { id: "insult", enabledByDefault: true },
  { id: "profanity", enabledByDefault: false },
];

/** @type {Category[]} */
export const DEFAULT_CATEGORIES = CATEGORIES.filter((c) => c.enabledByDefault).map((c) => c.id);
