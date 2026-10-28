/**
 * Les filtres proposés à l'utilisateur. Chaque règle des listes appartient à
 * une seule de ces catégories, et ne compte que si sa catégorie est activée.
 */

/**
 * @typedef {"racism" | "hate" | "threat" | "insult" | "profanity"} Category
 * @typedef {{ id: Category, label: string, description: string, enabledByDefault: boolean }} CategoryInfo
 */

/** @type {CategoryInfo[]} */
export const CATEGORIES = [
  {
    id: "racism",
    label: "Racisme",
    description: "Insultes racistes, « retourne dans ton pays », xénophobie.",
    enabledByDefault: true,
  },
  {
    id: "hate",
    label: "Autres haines",
    description: "Religion, homophobie et transphobie, handicap, sexisme.",
    enabledByDefault: true,
  },
  {
    id: "threat",
    label: "Menaces",
    description: "Menaces de mort, appels à la violence.",
    enabledByDefault: true,
  },
  {
    id: "insult",
    label: "Insultes",
    description: "Insultes adressées à quelqu'un.",
    enabledByDefault: true,
  },
  {
    id: "profanity",
    label: "Vulgarité",
    description: "Jurons, même sans personne visée.",
    enabledByDefault: false,
  },
];

/** @type {Category[]} */
export const DEFAULT_CATEGORIES = CATEGORIES.filter((c) => c.enabledByDefault).map((c) => c.id);

/** @param {string} id */
export const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
