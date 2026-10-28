/**
 * Floute un élément de X (tweet, tweet cité, carte de compte, bio) et pose le
 * bouton « Afficher quand même » par dessus.
 *
 * X détruit et recrée les éléments pendant le scroll. L'état masqué ou révélé
 * est donc gardé par clé (voir unitKey), pas seulement dans le DOM : un
 * élément recréé reprend son état. Cette mémoire dure le temps de l'onglet.
 *
 * Seuls des attributs data-voyou-* sont posés sur les éléments de X. React
 * réécrit les classes de ses éléments, mais ne touche pas aux attributs qu'il
 * ne connaît pas.
 */
import { t } from "../i18n.js";

const STATE = "data-voyou-state"; // "hidden" ou "revealed"
const KEY = "data-voyou-key";
const TARGET = "data-voyou-target"; // enfants floutés
const COMPACT = "data-voyou-compact"; // élément trop petit pour la barre d'actions
const UI_SELECTOR = ".voyou-overlay, .voyou-rehide";
// En dessous de cette hauteur (un nom, une bio d'une ligne), le voile est réduit au bouton.
const COMPACT_HEIGHT = 72;

/**
 * @typedef {object} TreatOptions
 * @property {string} reason catégorie affichée sous le bouton, vide si inconnue
 * @property {string | null} author compte à proposer d'autoriser
 *
 * @typedef {object} Actions
 * @property {(el: HTMLElement) => void} notHate « Ce n'est pas de la haine »
 * @property {(handle: string) => void} allow « Autoriser @compte »
 */

/** @type {Set<string>} */
const hiddenKeys = new Set();
/** @type {Set<string>} */
const revealedKeys = new Set();
/** @type {WeakSet<HTMLElement>} */
const boundElements = new WeakSet();
/** @type {Set<(count: number) => void>} */
const listeners = new Set();
/** @type {Actions} */
let actions = { notHate: () => {}, allow: () => {} };

/** @param {Actions} handlers */
export function setActions(handlers) {
  actions = handlers;
}

/**
 * Prévient quand le nombre d'éléments masqués change (pour le compteur).
 * @param {(count: number) => void} listener
 */
export function onHiddenCountChange(listener) {
  listeners.add(listener);
}

export const hiddenCount = () => hiddenKeys.size;

function notify() {
  for (const listener of listeners) listener(hiddenKeys.size);
}

/** @param {string} key */
export const isHiddenKey = (key) => hiddenKeys.has(key);

/** @param {HTMLElement} el */
export const isTreated = (el) => el.hasAttribute(STATE);

/**
 * Oublie quels éléments étaient masqués, quand les réglages changent : chacun
 * sera renoté avec les nouveaux filtres. Les éléments révélés restent révélés.
 */
export function forgetHidden() {
  hiddenKeys.clear();
  notify();
}

/**
 * Oublie une clé, par exemple quand on découvre que le tweet est à l'utilisateur.
 * @param {string} key
 */
export function forgetKey(key) {
  revealedKeys.delete(key);
  if (hiddenKeys.delete(key)) notify();
}

/**
 * Floute tous les enfants directs, sauf l'interface de Voyou. Le filtre CSS
 * s'applique à ces enfants plutôt qu'à l'élément, pour que le bouton posé par
 * dessus reste net.
 * @param {HTMLElement} el
 */
function markTargets(el) {
  const hidden = el.getAttribute(STATE) === "hidden";
  for (const child of el.children) {
    if (child.matches(UI_SELECTOR)) continue;
    child.setAttribute(TARGET, "");
    // Les lecteurs d'écran ne lisent pas non plus le contenu masqué.
    child.toggleAttribute("aria-hidden", hidden);
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
  const sizeBefore = hiddenKeys.size;
  if (state === "hidden") {
    hiddenKeys.add(key);
    revealedKeys.delete(key);
  } else {
    hiddenKeys.delete(key);
    revealedKeys.add(key);
  }
  if (hiddenKeys.size !== sizeBefore) notify();
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

/** @param {HTMLElement} el */
function ensureUi(el) {
  if (!el.querySelector(":scope > .voyou-overlay")) {
    const overlay = document.createElement("div");
    overlay.className = "voyou-overlay";
    // Dit pourquoi l'élément est masqué, sans jamais en montrer le contenu.
    const reason = document.createElement("p");
    reason.className = "voyou-reason";
    overlay.append(button("reveal", t("reveal"), undefined, true), reason);
    el.append(overlay);
  }
  if (!el.hasAttribute(COMPACT) && !el.querySelector(":scope > .voyou-rehide")) {
    const bar = document.createElement("div");
    bar.className = "voyou-rehide";
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
  el.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-voyou-action]") : null;
    if (!target || target.closest(`[${STATE}]`) !== el) return;
    // Sans ça, le clic remonte jusqu'à X qui ouvre le tweet.
    event.preventDefault();
    event.stopPropagation();
    switch (target.getAttribute("data-voyou-action")) {
      case "reveal":
        setState(el, "revealed");
        break;
      case "rehide":
        setState(el, "hidden");
        /** @type {HTMLElement | null} */ (el.querySelector(":scope > .voyou-overlay button"))?.focus();
        break;
      case "not-hate":
        actions.notHate(el);
        break;
      case "allow": {
        const handle = el.dataset.voyouAuthor;
        if (handle) actions.allow(handle);
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
export function treat(el, key, { reason, author }) {
  if (!isTreated(el)) el.toggleAttribute(COMPACT, el.getBoundingClientRect().height < COMPACT_HEIGHT);
  el.setAttribute(KEY, key);
  if (author) el.dataset.voyouAuthor = author;
  ensureUi(el);
  const reasonEl = el.querySelector(":scope > .voyou-overlay .voyou-reason");
  if (reasonEl && reasonEl.textContent !== reason) reasonEl.textContent = reason;
  const allow = el.querySelector(':scope > .voyou-rehide [data-voyou-action="allow"]');
  if (allow instanceof HTMLElement) {
    allow.hidden = !author;
    if (author) allow.textContent = t("allowAccount", author);
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
    child.removeAttribute("aria-hidden");
  }
  for (const attr of [STATE, KEY, COMPACT, "data-voyou-author"]) el.removeAttribute(attr);
}

export function untreatAll() {
  for (const el of document.querySelectorAll(`[${STATE}]`)) {
    if (el instanceof HTMLElement) untreat(el);
  }
}
