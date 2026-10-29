/**
 * Floute un élément de X (tweet, tweet cité, carte de compte, bio) et pose le
 * bouton « Afficher quand même » par-dessus.
 *
 * X détruit et recrée les éléments pendant le scroll. L'état masqué ou révélé
 * est donc gardé par clé (voir unitKey), pas seulement dans le DOM : un
 * élément recréé reprend son état. Cette mémoire dure le temps de l'onglet.
 *
 * Sur les éléments de X, Voyou pose des attributs data-voyou-* et, sur les
 * enfants floutés d'un élément masqué, inert (sauf s'ils l'avaient déjà). Il
 * ajoute à la fin de l'élément ses propres blocs : le voile (.voyou-overlay)
 * et la barre d'actions (.voyou-rehide). React réécrit les classes de ses
 * éléments, mais ne touche pas aux attributs qu'il ne connaît pas.
 */
import { t } from "../i18n.js";
import { isAlive } from "../lifecycle.js";

export const STATE = "data-voyou-state"; // "hidden" ou "revealed"
const KEY = "data-voyou-key";
const TARGET = "data-voyou-target"; // enfants floutés
const COMPACT = "data-voyou-compact"; // élément petit : voile réduit au bouton
const INERT = "data-voyou-inert"; // inert posé par Voyou, pas par X
export const UI_SELECTOR = ".voyou-overlay, .voyou-rehide";
// En dessous de cette hauteur (un nom, une bio d'une ligne), le voile est réduit au bouton.
const COMPACT_HEIGHT = 72;

/**
 * @typedef {object} TreatOptions
 * @property {string} reason catégorie affichée sous le bouton, vide si inconnue
 * @property {string | null} author compte à proposer d'autoriser
 * @property {boolean} [post] post ou tweet cité : barre d'actions une fois
 *   révélé, même petit (sinon, seulement s'il n'est pas compact)
 *
 * @typedef {object} Actions
 * @property {(el: HTMLElement) => void} notHate « Ce n'est pas de la haine »
 * @property {(handle: string) => void} allow « Autoriser `@compte` »
 */

/** @type {Set<string>} */
const hiddenKeys = new Set();
/** @type {Set<string>} */
const revealedKeys = new Set();
/**
 * Clés masquées depuis l'arrivée sur l'adresse en cours, pour le compteur. Un
 * tweet masqué que X retire du DOM en défilant y reste : il est toujours sur
 * cette page pour l'utilisateur.
 * @type {Set<string>}
 */
const pageKeys = new Set();
/** @type {WeakSet<HTMLElement>} */
const boundElements = new WeakSet();
/**
 * Compte proposé par « Autoriser », gardé hors du DOM : la page ne peut pas le
 * réécrire juste avant un clic.
 * @type {WeakMap<HTMLElement, string>}
 */
const authors = new WeakMap();
/** @type {Set<(count: number) => void>} */
const listeners = new Set();
/** @type {Actions} */
let actions = { notHate: () => {}, allow: () => {} };

/** @param {Actions} handlers */
export function setActions(handlers) {
  actions = handlers;
}

/**
 * Prévient quand le nombre d'éléments masqués sur la page change (pour le compteur).
 * @param {(count: number) => void} listener
 */
export function onHiddenCountChange(listener) {
  listeners.add(listener);
}

export const hiddenCount = () => pageKeys.size;

function notify() {
  for (const listener of listeners) listener(pageKeys.size);
}

/**
 * X a changé de page sans recharger : le compteur repart de zéro, et la passe
 * qui suit recompte les éléments masqués encore affichés. La mémoire de
 * session, elle, est gardée.
 */
export function newPage() {
  if (!pageKeys.size) return;
  pageKeys.clear();
  notify();
}

/** @param {string} key */
export const isHiddenKey = (key) => hiddenKeys.has(key);

/** @param {HTMLElement} el */
export const isTreated = (el) => el.hasAttribute(STATE);

/** @param {HTMLElement} el */
export const isHidden = (el) => el.getAttribute(STATE) === "hidden";

/**
 * Oublie quels éléments étaient masqués, quand les réglages changent : chacun
 * sera renoté avec les nouveaux filtres. Les éléments révélés restent révélés.
 */
export function forgetHidden() {
  hiddenKeys.clear();
  pageKeys.clear();
  notify();
}

/**
 * Oublie une clé, par exemple quand on découvre que le tweet est à l'utilisateur.
 * @param {string} key
 */
export function forgetKey(key) {
  revealedKeys.delete(key);
  hiddenKeys.delete(key);
  if (pageKeys.delete(key)) notify();
}

/**
 * Floute tous les enfants directs, sauf l'interface de Voyou. Le filtre CSS
 * s'applique à ces enfants plutôt qu'à l'élément, pour que le bouton posé
 * par-dessus reste net.
 * @param {HTMLElement} el
 */
function markTargets(el) {
  const hidden = el.getAttribute(STATE) === "hidden";
  for (const child of el.children) {
    if (child.matches(UI_SELECTOR)) continue;
    child.setAttribute(TARGET, "");
    if (!(child instanceof HTMLElement)) continue;
    // inert retire le contenu masqué des lecteurs d'écran, de la touche Tab et
    // de la recherche dans la page. aria-hidden ne suffirait pas : X nomme
    // l'article par aria-labelledby, qui lit même les nœuds cachés. Seul
    // l'inert posé par Voyou est retiré, jamais celui de X.
    if (hidden && !child.inert) {
      child.inert = true;
      child.setAttribute(INERT, "");
    } else if (!hidden && child.hasAttribute(INERT)) {
      child.inert = false;
      child.removeAttribute(INERT);
    }
  }
}

/**
 * @param {HTMLElement} el
 * @param {"hidden" | "revealed"} state
 */
function setState(el, state) {
  const key = el.getAttribute(KEY);
  el.setAttribute(STATE, state);
  markTargets(el);
  if (!key) return;
  const sizeBefore = pageKeys.size;
  if (state === "hidden") {
    hiddenKeys.add(key);
    pageKeys.add(key);
    revealedKeys.delete(key);
  } else {
    hiddenKeys.delete(key);
    pageKeys.delete(key);
    revealedKeys.add(key);
  }
  if (pageKeys.size !== sizeBefore) notify();
}

/**
 * @param {string} action
 * @param {string} label
 * @param {string} [title]
 * @param {boolean} [primary]
 */
function button(action, label, title, primary = false) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = primary ? "voyou-btn" : "voyou-btn voyou-btn--ghost";
  el.dataset.voyouAction = action;
  el.textContent = label;
  if (title) el.title = title;
  return el;
}

/**
 * Le voile et la barre portent hidden : seul content.css les affiche. Quand
 * Firefox désactive l'extension, il retire la feuille sans laisser ce script
 * rien nettoyer, et ces boutons morts disparaissent avec elle.
 * @param {HTMLElement} el
 * @param {boolean} withBar barre d'actions sous l'élément révélé
 */
function ensureUi(el, withBar) {
  if (!el.querySelector(":scope > .voyou-overlay")) {
    const overlay = document.createElement("div");
    overlay.className = "voyou-overlay";
    overlay.hidden = true;
    // Dit pourquoi l'élément est masqué, sans jamais en montrer le contenu.
    const reason = document.createElement("p");
    reason.className = "voyou-reason";
    overlay.append(button("reveal", t("reveal"), undefined, true), reason);
    el.append(overlay);
  }
  if (withBar && !el.querySelector(":scope > .voyou-rehide")) {
    const bar = document.createElement("div");
    bar.className = "voyou-rehide";
    bar.hidden = true;
    const rehide = button("rehide", t("rehide"));
    rehide.setAttribute("aria-label", t("rehideLabel"));
    bar.append(
      button("not-hate", t("notHate"), t("notHateTitle")),
      button("allow", "", t("allowAccountTitle")),
      rehide,
    );
    el.append(bar);
  }
  if (boundElements.has(el)) return;
  boundElements.add(el);
  /**
   * Le voile et la barre sont à Voyou : aucun clic dessus, bouton ou pas, ne
   * remonte jusqu'à X, qui ouvrirait le post, le tweet cité ou le profil
   * masqué. Le voile d'un tweet cité est à ce tweet cité, pas à celui-ci.
   * @param {MouseEvent} event
   * @returns {Element | null} le bouton visé
   */
  const ownClick = (event) => {
    const ui = event.target instanceof Element ? event.target.closest(UI_SELECTOR) : null;
    if (!ui || ui.parentElement !== el) return null;
    event.preventDefault();
    event.stopPropagation();
    return /** @type {Element} */ (event.target).closest("[data-voyou-action]");
  };
  el.addEventListener("auxclick", ownClick);
  el.addEventListener("click", (event) => {
    switch (ownClick(event)?.getAttribute("data-voyou-action")) {
      case "reveal": {
        setState(el, "revealed");
        // Le voile disparaît avec son bouton : le focus passe sur le post
        // révélé, ou à défaut sur « Masquer », plutôt que de retomber sur la page.
        const next = el.tabIndex >= 0 ? el : el.querySelector(':scope > .voyou-rehide [data-voyou-action="rehide"]');
        if (next instanceof HTMLElement) next.focus({ preventScroll: true });
        break;
      }
      case "rehide":
        setState(el, "hidden");
        /** @type {HTMLElement | null} */ (el.querySelector(":scope > .voyou-overlay button"))?.focus({
          preventScroll: true,
        });
        break;
      // Seul un vrai clic (souris, clavier) change un réglage, pas un clic
      // fabriqué par le JavaScript de la page.
      case "not-hate":
        if (event.isTrusted) actions.notHate(el);
        break;
      case "allow": {
        const handle = authors.get(el);
        if (handle && event.isTrusted) actions.allow(handle);
        break;
      }
    }
  });
}

/**
 * Masque un élément, ou le laisse révélé si l'utilisateur l'a déjà révélé.
 * Peut être rappelée sans risque : elle répare ce que X a pu recréer.
 * @param {HTMLElement} el
 * @param {string} key
 * @param {TreatOptions} options
 */
export function treat(el, key, { reason, author, post = false }) {
  if (!isTreated(el)) el.toggleAttribute(COMPACT, el.getBoundingClientRect().height < COMPACT_HEIGHT);
  el.setAttribute(KEY, key);
  if (author) authors.set(el, author);
  ensureUi(el, post || !el.hasAttribute(COMPACT));
  // Écrire textContent remplace le nœud texte même s'il ne change pas : une
  // passe sur un élément déjà traité ne doit pas modifier le DOM.
  const reasonEl = el.querySelector(":scope > .voyou-overlay .voyou-reason");
  if (reasonEl && reasonEl.textContent !== reason) reasonEl.textContent = reason;
  // Coupé de l'extension par une mise à jour, Voyou ne peut plus enregistrer
  // de réglage : ces deux boutons ne sont plus proposés.
  const canSave = isAlive();
  const notHate = el.querySelector(':scope > .voyou-rehide [data-voyou-action="not-hate"]');
  if (notHate instanceof HTMLElement) notHate.hidden = !canSave;
  const allow = el.querySelector(':scope > .voyou-rehide [data-voyou-action="allow"]');
  if (allow instanceof HTMLElement) {
    allow.hidden = !canSave || !author;
    const label = author ? t("allowAccount", author) : "";
    if (allow.textContent !== label) allow.textContent = label;
  }
  setState(el, revealedKeys.has(key) ? "revealed" : "hidden");
}

/**
 * Retire tout ce que Voyou a ajouté. La mémoire de session est gardée :
 * si Voyou est réactivé, l'élément revient dans le même état.
 * @param {HTMLElement} el
 */
export function untreat(el) {
  if (!isTreated(el)) return;
  for (const ui of el.querySelectorAll(`:scope > :is(${UI_SELECTOR})`)) ui.remove();
  for (const child of el.querySelectorAll(`:scope > [${TARGET}]`)) {
    child.removeAttribute(TARGET);
    if (child.hasAttribute(INERT)) {
      child.removeAttribute("inert");
      child.removeAttribute(INERT);
    }
    // aria-hidden vide : laissé par la version 0.3.0.
    if (child.getAttribute("aria-hidden") === "") child.removeAttribute("aria-hidden");
  }
  authors.delete(el);
  // data-voyou-author : laissé par la version 0.3.0.
  for (const attr of [STATE, KEY, COMPACT, "data-voyou-author"]) el.removeAttribute(attr);
}

export function untreatAll() {
  for (const el of document.querySelectorAll(`[${STATE}]`)) {
    if (el instanceof HTMLElement) untreat(el);
  }
}
