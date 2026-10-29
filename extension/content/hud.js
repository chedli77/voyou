/**
 * Module flottant sur X : il affiche combien d'éléments sont masqués, se
 * déplace en le faisant glisser, et s'agrandit en panneau de réglages quand
 * on clique dessus.
 *
 * Il vit dans un Shadow DOM fermé : les styles de X ne le cassent pas, et le
 * JavaScript de X ne peut ni parcourir le panneau ni lire la valeur de ses
 * champs. Les touches et la saisie faites dans le module s'arrêtent à sa
 * frontière : ni les raccourcis clavier de X ni ses écouteurs ordinaires ne
 * les reçoivent. Un écouteur que X poserait en phase de capture sur window
 * ou document les verrait quand même passer. Sa position est gardée dans
 * chrome.storage.local.
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
// Largeur du panneau (panel.css), tant qu'il n'est pas affiché pour la mesurer.
const PANEL_WIDTH = 320;
// Événements composés, qui sortiraient du Shadow DOM reciblés sur l'hôte :
// X y verrait ce qui est tapé et ses raccourcis (j'aime, reposter, nouveau
// post, navigation) se déclencheraient.
const BOUNDARY_EVENTS = [
  "keydown",
  "keyup",
  "keypress",
  "beforeinput",
  "input",
  "compositionstart",
  "compositionupdate",
  "compositionend",
  "paste",
  "copy",
  "cut",
];

/** @type {HTMLElement | null} */
let host = null;
/** @type {ShadowRoot | null} */
let shadow = null;
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
// Numéro du dernier montage du panneau : un montage dépassé se retire.
let mountGen = 0;
// Le panneau était ouvert quand un montage encore en cours a commencé.
let reopen = false;

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
  pill.setAttribute("aria-description", t("hudMove"));
  pill.setAttribute("aria-expanded", String(open));
  // Repères pour les tests, le Shadow DOM fermé ne se lisant pas de
  // l'extérieur. La page les voit aussi, mais ils ne disent rien que les
  // voiles ne montrent déjà.
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

/**
 * Ouvre le panneau du côté où il y a le plus de place, sans jamais sortir de
 * la fenêtre : la partie d'une boîte qui en sort ne se rattrape pas en
 * défilant (petite fenêtre, zoom fort).
 */
function placePanel() {
  if (!host || !hud || !panelBox) return;
  const rect = host.getBoundingClientRect();
  const up = rect.top + rect.height / 2 > innerHeight / 2;
  const right = rect.left + rect.width / 2 > innerWidth / 2;
  hud.dataset.v = up ? "up" : "down";
  hud.dataset.h = right ? "right" : "left";
  panelBox.style.maxHeight = `${Math.max(0, (up ? rect.top : innerHeight - rect.bottom) - 2 * MARGIN - 10)}px`;
  // Aligné sur un bord de la pastille, puis décalé pour rester entre les marges.
  const width = Math.min(panelBox.offsetWidth || PANEL_WIDTH, innerWidth - 2 * MARGIN);
  if (right) {
    panelBox.style.left = "";
    panelBox.style.right = `${-Math.max(0, MARGIN - (rect.right - width))}px`;
  } else {
    panelBox.style.right = "";
    panelBox.style.left = `${-Math.max(0, rect.left + width - (innerWidth - MARGIN))}px`;
  }
}

/** Commandes du module que Tab atteint, dans l'ordre : la pastille, puis le panneau ouvert. */
function focusables() {
  if (!pill || !panelBox) return [];
  /** @type {HTMLElement[]} */
  const list = [pill];
  if (!open) return list;
  for (const el of panelBox.querySelectorAll("button, input, select, textarea, a[href], [tabindex]")) {
    if (el instanceof HTMLElement && el.tabIndex >= 0 && !el.matches(":disabled") && el.getClientRects().length) {
      list.push(el);
    }
  }
  return list;
}

/** @param {boolean} [focus] mettre le focus dans le panneau */
function openPanel(focus = true) {
  if (!panelBox || open) return;
  open = true;
  panelBox.hidden = false;
  placePanel();
  panelBox.classList.remove("is-closing");
  panelBox.classList.add("is-opening");
  render();
  // Au clavier comme à la souris, le focus entre dans le panneau : Tab y
  // circule, Échap le réduit.
  if (focus) focusables()[1]?.focus({ preventScroll: true });
}

/** @param {boolean} [refocus] rendre le focus à la pastille s'il était dans le module */
function closePanel(refocus = true) {
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
  // Jamais pris à un champ de X : seulement s'il était dans le module.
  if (refocus && shadow?.activeElement) pill?.focus();
}

/**
 * Touches tapées dans le module, avant qu'elles ne s'arrêtent à sa frontière :
 * Échap réduit le panneau, Tab circule entre la pastille et le panneau ouvert.
 * @param {KeyboardEvent} event
 */
function onKeydown(event) {
  if (!open) return;
  if (event.key === "Escape") {
    closePanel();
    return;
  }
  if (event.key !== "Tab") return;
  const list = focusables();
  const first = list[0];
  const last = list[list.length - 1];
  const current = shadow?.activeElement;
  if (!event.shiftKey && current === last) {
    event.preventDefault();
    first?.focus();
  } else if (event.shiftKey && current === first) {
    event.preventDefault();
    last?.focus();
  }
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

  // Un clic ailleurs sur la page réduit le panneau, et laisse le focus où il va.
  // Échap, lui, n'est écouté que dans le module (onKeydown) : X s'en sert
  // pour ses propres menus.
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (open && !event.composedPath().includes(hostEl)) closePanel(false);
    },
    true,
  );
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
  // Sous Firefox, une mise à jour réinjecte ce script dans les onglets ouverts
  // sans rien laisser exécuter à l'ancien : son module, figé, est encore là.
  for (const stale of document.querySelectorAll("#voyou-hud")) stale.remove();
  host = document.createElement("div");
  host.id = "voyou-hud";
  Object.assign(host.style, { position: "fixed", right: "16px", bottom: "16px", zIndex: "2147483000" });
  shadow = host.attachShadow({ mode: "closed" });
  for (const type of BOUNDARY_EVENTS) {
    shadow.addEventListener(type, (event) => {
      if (type === "keydown") onKeydown(/** @type {KeyboardEvent} */ (event));
      event.stopPropagation();
    });
  }
  const style = document.createElement("style");
  style.textContent = HUD_CSS;

  label = document.createElement("span");
  pill = document.createElement("button");
  pill.type = "button";
  pill.className = "hud__pill";
  pill.append(dots(), label);
  panelBox = document.createElement("div");
  panelBox.className = "hud__panel";
  panelBox.id = "voyou-hud-panel";
  panelBox.hidden = true;
  pill.setAttribute("aria-controls", panelBox.id);
  hud = document.createElement("div");
  hud.className = "hud";
  hud.dataset.v = "up";
  hud.dataset.h = "right";
  // La pastille d'abord : Tab va d'elle au panneau qu'elle ouvre.
  hud.append(pill, panelBox);
  shadow.append(style, hud);
  (document.body ?? document.documentElement).append(host);
  // Coupé de l'extension, le module ne pourrait plus rien enregistrer : on le retire.
  const hostEl = host;
  onShutdown(() => hostEl.remove());

  await remount(dark);
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
 * Monte un panneau neuf. Deux montages peuvent se croiser (langue de X changée
 * pendant le chargement, ou deux fois de suite) : seul le dernier reste.
 * @param {boolean} dark
 * @returns {Promise<boolean>} faux si un montage plus récent l'a remplacé
 */
async function remount(dark) {
  if (!panelBox) return false;
  const gen = ++mountGen;
  panel?.destroy();
  panel = null;
  // Chaque montage a sa boîte : celle d'un montage dépassé, déjà retirée,
  // emporte son style et son panneau.
  const box = document.createElement("div");
  panelBox.replaceChildren(box);
  const next = await mountPanel(box, { pageCount: () => count, onClose: () => closePanel(), dark });
  if (gen !== mountGen) {
    next.destroy();
    return false;
  }
  panel = next;
  return true;
}

/**
 * Reconstruit le panneau et les libellés, par exemple quand la langue de X change.
 * @param {{ dark: boolean }} options
 */
export async function rebuildHud({ dark }) {
  if (!panelBox) return;
  const wasOpen = open || reopen;
  reopen = wasOpen;
  closePanel();
  if (!(await remount(dark))) return;
  reopen = false;
  render();
  if (wasOpen) openPanel(false);
}

/** @param {boolean} dark */
export function setHudTheme(dark) {
  hud?.classList.toggle("is-dark", dark);
  panel?.setDark(dark);
}
