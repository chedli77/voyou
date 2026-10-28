/**
 * Petit compteur flottant « N masqués », déplaçable et réductible.
 * Sa position et son état réduit sont gardés dans chrome.storage.local.
 */

import { plural, t } from "../i18n.js";

const POSITION_KEY = "hudPosition";
const MINIMIZED_KEY = "hudMinimized";
const MARGIN = 8;
const CHEVRON_DOWN = "M3 5.5 L7 9.5 L11 5.5";
const CHEVRON_UP = "M3 8.5 L7 4.5 L11 8.5";

/** @param {number} n */
const countLabel = (n) => plural("hudCount", n);

const SVG = "http://www.w3.org/2000/svg";

/**
 * @param {string} tag
 * @param {Record<string, string>} attributes
 * @param {Element[]} [children]
 */
function svg(tag, attributes, children = []) {
  const el = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
  el.append(...children);
  return el;
}

/** Contenu du compteur, construit sans innerHTML. */
function buildContent() {
  const icon = (/** @type {Element[]} */ children) =>
    svg("svg", { class: "voyou-hud__icon", viewBox: "0 0 14 14", "aria-hidden": "true" }, children);
  const drag = document.createElement("button");
  drag.type = "button";
  drag.className = "voyou-hud__drag";
  drag.append(
    icon(
      [3.5, 7, 10.5].flatMap((cy) => [4, 10].map((cx) => svg("circle", { cx: String(cx), cy: String(cy), r: "1.2" }))),
    ),
  );
  const count = document.createElement("p");
  count.className = "voyou-hud__count";
  const minimize = document.createElement("button");
  minimize.type = "button";
  minimize.className = "voyou-hud__minimize";
  minimize.setAttribute("aria-expanded", "true");
  minimize.append(icon([svg("path", { d: CHEVRON_DOWN })]));
  const inner = document.createElement("div");
  inner.className = "voyou-hud__inner";
  inner.append(drag, count, minimize);
  return inner;
}

/** @type {HTMLElement | null} */
let hud = null;
let enabled = true;
let count = 0;

/**
 * @param {string} selector
 * @returns {Element}
 */
function part(selector) {
  const el = hud?.querySelector(selector);
  if (!el) throw new Error(`HUD : ${selector} introuvable`);
  return el;
}

function render() {
  if (!hud) return;
  part(".voyou-hud__count").textContent = countLabel(count);
  hud.setAttribute("aria-label", `Voyou : ${countLabel(count)}`);
  hud.hidden = !enabled || count === 0;
}

/**
 * Place le compteur en restant dans la fenêtre.
 * @param {number} left
 * @param {number} top
 */
function moveTo(left, top) {
  if (!hud) return { left, top };
  const rect = hud.getBoundingClientRect();
  const clamped = {
    left: Math.min(Math.max(MARGIN, left), Math.max(MARGIN, innerWidth - rect.width - MARGIN)),
    top: Math.min(Math.max(MARGIN, top), Math.max(MARGIN, innerHeight - rect.height - MARGIN)),
  };
  Object.assign(hud.style, { left: `${clamped.left}px`, top: `${clamped.top}px`, right: "auto", bottom: "auto" });
  return clamped;
}

/** @param {{ left: number, top: number }} position */
const savePosition = (position) => chrome.storage.local.set({ [POSITION_KEY]: position });

/** @param {boolean} minimized */
function setMinimized(minimized) {
  if (!hud) return;
  hud.dataset.minimized = String(minimized);
  const button = part(".voyou-hud__minimize");
  button.setAttribute("aria-expanded", String(!minimized));
  button.setAttribute("aria-label", minimized ? t("hudExpand") : t("hudMinimize"));
  part(".voyou-hud__minimize path").setAttribute("d", minimized ? CHEVRON_UP : CHEVRON_DOWN);
}

/**
 * Glisser avec la souris, ou flèches du clavier (Maj pour aller plus vite).
 * @param {HTMLElement} handle
 */
function enableDrag(handle) {
  /** @type {{ x: number, y: number, left: number, top: number } | null} */
  let start = null;

  handle.addEventListener("pointerdown", (event) => {
    if (!hud || event.button !== 0) return;
    const rect = hud.getBoundingClientRect();
    start = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
    hud.dataset.dragging = "true";
    handle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  handle.addEventListener("pointermove", (event) => {
    if (start) moveTo(start.left + event.clientX - start.x, start.top + event.clientY - start.y);
  });
  const stop = () => {
    if (!start || !hud) return;
    start = null;
    delete hud.dataset.dragging;
    const rect = hud.getBoundingClientRect();
    savePosition(moveTo(rect.left, rect.top));
  };
  handle.addEventListener("pointerup", stop);
  handle.addEventListener("pointercancel", stop);

  /** @type {Record<string, [number, number]>} */
  const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  handle.addEventListener("keydown", (event) => {
    const direction = arrows[event.key];
    if (!direction || !hud) return;
    event.preventDefault();
    const step = event.shiftKey ? 20 : 8;
    const rect = hud.getBoundingClientRect();
    savePosition(moveTo(rect.left + direction[0] * step, rect.top + direction[1] * step));
  });
}

/** Crée le compteur. Il reste caché tant qu'aucun tweet n'est masqué. */
export async function initHud() {
  hud = document.createElement("aside");
  hud.className = "voyou-hud";
  hud.setAttribute("role", "status");
  hud.setAttribute("aria-live", "polite");
  hud.append(buildContent());
  hud.hidden = true;
  (document.body ?? document.documentElement).append(hud);

  const drag = /** @type {HTMLElement} */ (part(".voyou-hud__drag"));
  drag.setAttribute("aria-label", t("hudMove"));
  drag.title = t("hudMove");
  part(".voyou-hud__minimize").setAttribute("aria-label", t("hudMinimize"));
  enableDrag(drag);
  part(".voyou-hud__minimize").addEventListener("click", (event) => {
    event.stopPropagation();
    const minimized = hud?.dataset.minimized !== "true";
    setMinimized(minimized);
    chrome.storage.local.set({ [MINIMIZED_KEY]: minimized });
  });
  addEventListener("resize", () => {
    if (hud?.style.left) moveTo(hud.getBoundingClientRect().left, hud.getBoundingClientRect().top);
  });

  const saved = await chrome.storage.local.get([POSITION_KEY, MINIMIZED_KEY]);
  setMinimized(saved[MINIMIZED_KEY] === true);
  const position = /** @type {{ left?: unknown, top?: unknown } | undefined} */ (saved[POSITION_KEY]);
  if (typeof position?.left === "number" && typeof position?.top === "number") moveTo(position.left, position.top);
  render();
}

/** @param {number} n */
export function setHudCount(n) {
  count = n;
  render();
}

/** @param {boolean} on */
export function setHudEnabled(on) {
  enabled = on;
  render();
}
