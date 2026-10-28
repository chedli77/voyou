/**
 * Floute un tweet et pose le bouton « Afficher quand même » par dessus.
 *
 * X détruit et recrée les tweets pendant le scroll. L'état masqué ou révélé
 * est donc gardé par clé de tweet (voir unitKey), pas seulement dans le DOM :
 * un tweet recréé reprend son état. Cette mémoire dure le temps de l'onglet.
 *
 * Seuls des attributs data-voyou-* sont posés sur les éléments de X. React
 * réécrit les classes de ses éléments, mais ne touche pas aux attributs qu'il
 * ne connaît pas.
 */

const STATE = "data-voyou-state"; // "hidden" ou "revealed", posé sur le tweet
const KEY = "data-voyou-key";
const TARGET = "data-voyou-target"; // enfants floutés du tweet
const UI_SELECTOR = ".voyou-overlay, .voyou-rehide";

/** @type {Set<string>} */
const hiddenKeys = new Set();
/** @type {Set<string>} */
const revealedKeys = new Set();
/** @type {WeakSet<HTMLElement>} */
const boundUnits = new WeakSet();
/** @type {Set<(count: number) => void>} */
const listeners = new Set();

/**
 * Prévient quand le nombre de tweets masqués change (pour le compteur).
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

/** @param {HTMLElement} unit */
export const isTreated = (unit) => unit.hasAttribute(STATE);

/**
 * Oublie une clé, par exemple quand on découvre que le tweet est à l'utilisateur.
 * @param {string} key
 */
export function forgetKey(key) {
  revealedKeys.delete(key);
  if (hiddenKeys.delete(key)) notify();
}

/**
 * Floute tous les enfants directs du tweet, sauf l'interface de Voyou.
 * Le filtre CSS s'applique à ces enfants plutôt qu'au tweet, pour que le
 * bouton posé par dessus reste net.
 * @param {HTMLElement} unit
 */
function markTargets(unit) {
  const hidden = unit.getAttribute(STATE) === "hidden";
  for (const child of unit.children) {
    if (child.matches(UI_SELECTOR)) continue;
    child.setAttribute(TARGET, "");
    // Les lecteurs d'écran ne lisent pas non plus le contenu masqué.
    child.toggleAttribute("aria-hidden", hidden);
  }
}

/**
 * @param {HTMLElement} unit
 * @param {"hidden" | "revealed"} state
 */
function setState(unit, state) {
  const key = unit.getAttribute(KEY);
  unit.setAttribute(STATE, state);
  markTargets(unit);
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
 * @param {string} className
 * @param {string} action
 * @param {string} label
 * @param {string} ariaLabel
 */
function createControl(className, action, label, ariaLabel) {
  const wrapper = document.createElement("div");
  wrapper.className = className;
  const button = document.createElement("button");
  button.type = "button";
  button.className = action === "reveal" ? "voyou-btn" : "voyou-btn voyou-btn--ghost";
  button.dataset.voyouAction = action;
  button.textContent = label;
  button.setAttribute("aria-label", ariaLabel);
  wrapper.append(button);
  return wrapper;
}

/** @param {HTMLElement} unit */
function ensureUi(unit) {
  if (!unit.querySelector(":scope > .voyou-overlay")) {
    unit.append(createControl("voyou-overlay", "reveal", "Afficher quand même", "Afficher quand même"));
  }
  if (!unit.querySelector(":scope > .voyou-rehide")) {
    unit.append(createControl("voyou-rehide", "rehide", "Masquer", "Masquer à nouveau"));
  }
  if (boundUnits.has(unit)) return;
  boundUnits.add(unit);
  unit.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("[data-voyou-action]") : null;
    if (!button || !unit.contains(button)) return;
    // Sans ça, le clic remonte jusqu'à X qui ouvre le tweet.
    event.preventDefault();
    event.stopPropagation();
    if (button.getAttribute("data-voyou-action") === "reveal") {
      setState(unit, "revealed");
    } else {
      setState(unit, "hidden");
      /** @type {HTMLElement | null} */ (unit.querySelector(":scope > .voyou-overlay button"))?.focus();
    }
  });
}

/**
 * Masque un tweet, ou le laisse révélé si l'utilisateur l'a déjà révélé.
 * Peut être rappelée sans risque : elle répare ce que X a pu recréer.
 * @param {HTMLElement} unit
 * @param {string} key
 */
export function treat(unit, key) {
  unit.setAttribute(KEY, key);
  ensureUi(unit);
  setState(unit, revealedKeys.has(key) ? "revealed" : "hidden");
}

/**
 * Retire tout ce que Voyou a ajouté. La mémoire de session est gardée :
 * si Voyou est réactivé, le tweet revient dans le même état.
 * @param {HTMLElement} unit
 */
export function untreat(unit) {
  if (!isTreated(unit)) return;
  for (const el of unit.querySelectorAll(`:scope > :is(${UI_SELECTOR})`)) el.remove();
  for (const child of unit.querySelectorAll(`:scope > [${TARGET}]`)) {
    child.removeAttribute(TARGET);
    child.removeAttribute("aria-hidden");
  }
  unit.removeAttribute(STATE);
  unit.removeAttribute(KEY);
}

export function untreatAll() {
  for (const unit of document.querySelectorAll(`[${STATE}]`)) {
    if (unit instanceof HTMLElement) untreat(unit);
  }
}
