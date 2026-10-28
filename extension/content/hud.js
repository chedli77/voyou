/**
 * Module flottant sur X : il affiche combien d'éléments sont masqués, se
 * déplace en le faisant glisser, et s'agrandit en panneau de réglages quand
 * on clique dessus.
 *
 * Il vit dans un Shadow DOM fermé : les styles de X ne le cassent pas, et le
 * JavaScript de X ne peut pas lire les réglages affichés (mots à masquer,
 * comptes autorisés). Sa position est gardée dans chrome.storage.local.
 */
import { plural, t } from "../i18n.js";
import { guard, onShutdown } from "../lifecycle.js";
import { mountPanel } from "../ui/panel.js";
import HUD_CSS from "./hud.css";

const POSITION_KEY = "hudPosition";
const MARGIN = 8;
// En dessous de ce déplacement, un appui est un clic, pas un glissé.
const DRAG_THRESHOLD = 4;
const SVG = "http://www.w3.org/2000/svg";

/** @type {HTMLElement | null} */
let host = null;
/** @type {HTMLElement | null} */
let hud = null;
/** @type {HTMLButtonElement | null} */
let pill = null;
/** @type {HTMLElement | null} */
let label = null;
/** @type {HTMLElement | null} */
let panelBox = null;
/** @type {import("../ui/panel.js").Panel | null} */
let panel = null;
let count = 0;
let open = false;

/** Les six points qui indiquent qu'on peut déplacer le module. */
function dots() {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", "hud__dots");
  svg.setAttribute("viewBox", "0 0 12 12");
  svg.setAttribute("aria-hidden", "true");
  for (const cy of [2, 6, 10]) {
    for (const cx of [3, 9]) {
      const dot = document.createElementNS(SVG, "circle");
      dot.setAttribute("cx", String(cx));
      dot.setAttribute("cy", String(cy));
      dot.setAttribute("r", "1.2");
      svg.append(dot);
    }
  }
  return svg;
}

function render() {
  if (!host || !pill || !label) return;
  label.textContent = count > 0 ? plural("hudCount", count) : "Voyou";
  pill.setAttribute("aria-label", `${t("hudOpen")} (${plural("hudCount", count)})`);
  pill.setAttribute("aria-expanded", String(open));
  // Repères pour les tests : le Shadow DOM fermé ne se lit pas de l'extérieur.
  host.dataset.count = String(count);
  host.dataset.open = String(open);
  panel?.refreshCount();
}

/**
 * Place le module en restant dans la fenêtre.
 * @param {number} left
 * @param {number} top
 */
function moveTo(left, top) {
  if (!host) return { left, top };
  const rect = host.getBoundingClientRect();
  const position = {
    left: Math.min(Math.max(MARGIN, left), Math.max(MARGIN, innerWidth - rect.width - MARGIN)),
    top: Math.min(Math.max(MARGIN, top), Math.max(MARGIN, innerHeight - rect.height - MARGIN)),
  };
  Object.assign(host.style, { left: `${position.left}px`, top: `${position.top}px`, right: "auto", bottom: "auto" });
  return position;
}

/** Ouvre le panneau du côté où il y a le plus de place, à la hauteur disponible. */
function placePanel() {
  if (!host || !hud || !panelBox) return;
  const rect = host.getBoundingClientRect();
  const up = rect.top + rect.height / 2 > innerHeight / 2;
  hud.dataset.v = up ? "up" : "down";
  hud.dataset.h = rect.left + rect.width / 2 > innerWidth / 2 ? "right" : "left";
  panelBox.style.maxHeight = `${Math.max(200, (up ? rect.top : innerHeight - rect.bottom) - 2 * MARGIN - 10)}px`;
}

function openPanel() {
  if (!panelBox || open) return;
  open = true;
  placePanel();
  panelBox.hidden = false;
  panelBox.classList.remove("is-closing");
  panelBox.classList.add("is-opening");
  render();
}

function closePanel() {
  if (!panelBox || !open) return;
  open = false;
  const box = panelBox;
  box.classList.remove("is-opening");
  box.classList.add("is-closing");
  const hide = () => {
    if (open) return;
    box.hidden = true;
    box.classList.remove("is-closing");
  };
  // Sans animation (mouvement réduit), animationend n'arrive jamais.
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) hide();
  else box.addEventListener("animationend", hide, { once: true });
  render();
  pill?.focus();
}

/** Glisser pour déplacer, cliquer pour ouvrir ou réduire, flèches du clavier pour déplacer. */
function enableInteractions() {
  if (!host || !hud || !pill) return;
  const hostEl = host;
  const hudEl = hud;
  const pillEl = pill;
  /** @type {{ x: number, y: number, left: number, top: number, moved: boolean } | null} */
  let press = null;

  pillEl.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const rect = hostEl.getBoundingClientRect();
    press = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, moved: false };
    pillEl.setPointerCapture(event.pointerId);
  });
  pillEl.addEventListener("pointermove", (event) => {
    if (!press) return;
    const dx = event.clientX - press.x;
    const dy = event.clientY - press.y;
    if (!press.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    press.moved = true;
    hudEl.classList.add("is-dragging");
    moveTo(press.left + dx, press.top + dy);
    if (open) placePanel();
  });
  pillEl.addEventListener("pointerup", () => {
    if (!press) return;
    const { moved } = press;
    press = null;
    hudEl.classList.remove("is-dragging");
    if (moved) {
      const rect = hostEl.getBoundingClientRect();
      const position = moveTo(rect.left, rect.top);
      if (guard()) chrome.storage.local.set({ [POSITION_KEY]: position });
    } else if (open) closePanel();
    else openPanel();
  });
  pillEl.addEventListener("pointercancel", () => {
    press = null;
    hudEl.classList.remove("is-dragging");
  });

  // Entrée et Espace passent par "click" ; la souris est déjà gérée par pointerup.
  pillEl.addEventListener("click", (event) => {
    if (event.detail !== 0) return;
    if (open) closePanel();
    else openPanel();
  });

  /** @type {Record<string, [number, number]>} */
  const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  pillEl.addEventListener("keydown", (event) => {
    const direction = arrows[event.key];
    if (!direction) return;
    event.preventDefault();
    const step = event.shiftKey ? 20 : 8;
    const rect = hostEl.getBoundingClientRect();
    const position = moveTo(rect.left + direction[0] * step, rect.top + direction[1] * step);
    if (guard()) chrome.storage.local.set({ [POSITION_KEY]: position });
    if (open) placePanel();
  });

  // Un clic ailleurs sur la page ou Échap réduisent le panneau.
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (open && !event.composedPath().includes(hostEl)) closePanel();
    },
    true,
  );
  document.addEventListener("keydown", (event) => {
    if (open && event.key === "Escape") closePanel();
  });
  addEventListener("resize", () => {
    if (hostEl.style.left) moveTo(hostEl.getBoundingClientRect().left, hostEl.getBoundingClientRect().top);
    if (open) placePanel();
  });
}

/**
 * Crée le module, visible en permanence pour qu'on puisse toujours ouvrir les réglages.
 * @param {{ dark: boolean }} options
 */
export async function initHud({ dark }) {
  host = document.createElement("div");
  host.id = "voyou-hud";
  Object.assign(host.style, { position: "fixed", right: "16px", bottom: "16px", zIndex: "2147483000" });
  const shadow = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = HUD_CSS;

  label = document.createElement("span");
  pill = document.createElement("button");
  pill.type = "button";
  pill.className = "hud__pill";
  pill.append(dots(), label);
  panelBox = document.createElement("div");
  panelBox.className = "hud__panel";
  panelBox.hidden = true;
  hud = document.createElement("div");
  hud.className = "hud";
  hud.dataset.v = "up";
  hud.dataset.h = "right";
  hud.append(panelBox, pill);
  shadow.append(style, hud);
  (document.body ?? document.documentElement).append(host);
  // Coupé de l'extension, le module ne pourrait plus rien enregistrer : on le retire.
  const hostEl = host;
  onShutdown(() => hostEl.remove());

  panel = await mountPanel(panelBox, { pageCount: () => count, onClose: closePanel, dark });
  setHudTheme(dark);
  enableInteractions();

  const saved = /** @type {{ left?: unknown, top?: unknown } | undefined} */ (
    (await chrome.storage.local.get(POSITION_KEY))[POSITION_KEY]
  );
  if (typeof saved?.left === "number" && typeof saved?.top === "number") moveTo(saved.left, saved.top);
  render();
}

/** @param {number} n */
export function setHudCount(n) {
  count = n;
  render();
}

/** @param {boolean} on */
export function setHudEnabled(on) {
  hud?.classList.toggle("is-off", !on);
}

/**
 * Reconstruit le panneau et les libellés, par exemple quand la langue de X change.
 * @param {{ dark: boolean }} options
 */
export async function rebuildHud({ dark }) {
  if (!panelBox) return;
  const wasOpen = open;
  if (open) closePanel();
  panel?.destroy();
  panelBox.replaceChildren();
  panel = await mountPanel(panelBox, { pageCount: () => count, onClose: closePanel, dark });
  render();
  if (wasOpen) openPanel();
}

/** @param {boolean} dark */
export function setHudTheme(dark) {
  hud?.classList.toggle("is-dark", dark);
  panel?.setDark(dark);
}
