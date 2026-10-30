/**
 * Les listes du détecteur, une par langue plus multi.json. Module à part pour
 * que la popup lise les notes des règles sans embarquer le détecteur.
 */
import ar from "./lists/ar.json" with { type: "json" };
import de from "./lists/de.json" with { type: "json" };
import en from "./lists/en.json" with { type: "json" };
import es from "./lists/es.json" with { type: "json" };
import fr from "./lists/fr.json" with { type: "json" };
import it from "./lists/it.json" with { type: "json" };
import multi from "./lists/multi.json" with { type: "json" };
import pt from "./lists/pt.json" with { type: "json" };

/** @type {Record<string, import("./score.js").RuleList>} */
export const LISTS = /** @type {any} */ ({ fr, en, es, pt, it, de, ar, multi });
