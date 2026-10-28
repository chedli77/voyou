/**
 * Popup de la barre d'outils, aussi ouverte en onglet comme page d'options
 * et comme écran d'accueil (?welcome, à l'installation). Chaque changement est enregistré tout
 * de suite dans chrome.storage ; le script injecté dans X l'applique sans
 * recharger la page.
 */
import { CATEGORIES } from "../detection/categories.js";
import { LISTS } from "../detection/score.js";
import { categoryLabel, plural, t } from "../i18n.js";
import { SENSITIVITIES, loadSettings, parseHandles, parseTerms, saveSettings } from "../settings.js";
import { readStats } from "../stats.js";

const STATS_DAYS = 7;
const TYPING_DELAY_MS = 400;

/**
 * @template {HTMLElement} T
 * @param {string} id
 * @returns {T}
 */
const byId = (id) => /** @type {T} */ (document.getElementById(id));

const enabledInput = /** @type {HTMLInputElement} */ (byId("enabled"));
const customInput = /** @type {HTMLTextAreaElement} */ (byId("custom"));
const allowedInput = /** @type {HTMLTextAreaElement} */ (byId("allowed"));

let settings = await loadSettings();

/** Textes traduits : data-i18n pour le contenu, data-i18n-title pour l'infobulle. */
function translatePage() {
  document.documentElement.lang = chrome.i18n.getUILanguage().split("-")[0];
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.getAttribute("data-i18n") ?? "");
  for (const el of document.querySelectorAll("[data-i18n-title]")) {
    if (el instanceof HTMLElement) el.title = t(el.getAttribute("data-i18n-title") ?? "");
  }
}

function renderState() {
  enabledInput.checked = settings.enabled;
  byId("enabled-state").textContent = settings.enabled ? t("popupOn") : t("popupOff");
  document.body.classList.toggle("is-off", !settings.enabled);
}

function renderFilters() {
  const fieldset = byId("filters");
  for (const category of CATEGORIES) {
    const row = document.createElement("label");
    row.className = "toggle";
    const text = document.createElement("span");
    text.className = "toggle__text";
    const label = document.createElement("span");
    label.className = "toggle__label";
    label.textContent = categoryLabel(category.id);
    const description = document.createElement("span");
    description.className = "toggle__description";
    description.textContent = t(`category_${category.id}_description`);
    text.append(label, description);
    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "toggle__input";
    input.checked = settings.categories.includes(category.id);
    input.addEventListener("change", () => {
      const enabled = new Set(settings.categories);
      if (input.checked) enabled.add(category.id);
      else enabled.delete(category.id);
      // Garde l'ordre de CATEGORIES pour un stockage stable.
      settings.categories = CATEGORIES.map((c) => c.id).filter((id) => enabled.has(id));
      saveSettings({ categories: settings.categories });
    });
    row.append(text, input);
    fieldset.append(row);
  }
}

function renderSensitivity() {
  const group = byId("sensitivity");
  for (const level of SENSITIVITIES) {
    const label = document.createElement("label");
    label.className = "segmented__option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "sensitivity";
    input.value = level;
    input.checked = settings.sensitivity === level;
    input.addEventListener("change", () => {
      settings.sensitivity = level;
      saveSettings({ sensitivity: level });
    });
    label.append(input, t(`sensitivity_${level}`));
    group.append(label);
  }
}

/**
 * Zone de texte enregistrée pendant la frappe, et remise au propre en sortant.
 * @param {HTMLTextAreaElement} input
 * @param {string[]} values
 * @param {(value: string) => string[]} parse
 * @param {(values: string[]) => void} save
 * @param {(value: string) => string} [format]
 */
function bindList(input, values, parse, save, format = (v) => v) {
  input.value = values.map(format).join("\n");
  let timer = 0;
  input.addEventListener("input", () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => save(parse(input.value)), TYPING_DELAY_MS);
  });
  input.addEventListener("blur", () => {
    input.value = parse(input.value).map(format).join("\n");
  });
}

/** Règles connues, pour afficher les règles ignorées de façon lisible. */
const RULES = new Map(
  Object.values(LISTS).flatMap((list) => [
    ...list.terms.map(
      (entry) => /** @type {const} */ ([entry.id, { category: entry.category, label: `« ${entry.terms[0]} »` }]),
    ),
    ...list.patterns.map((entry) => /** @type {const} */ ([entry.id, { category: entry.category, label: entry.note }])),
  ]),
);

function renderMuted() {
  const section = byId("muted");
  const list = byId("muted-list");
  list.replaceChildren();
  section.hidden = settings.mutedRules.length === 0;
  for (const id of settings.mutedRules) {
    const rule = RULES.get(id);
    const item = document.createElement("li");
    item.className = "muted__item";
    const text = document.createElement("span");
    text.textContent = rule ? `${categoryLabel(rule.category)} : ${rule.label}` : id;
    const restore = document.createElement("button");
    restore.type = "button";
    restore.className = "muted__restore";
    restore.textContent = t("popupMutedRestore");
    restore.addEventListener("click", () => {
      settings.mutedRules = settings.mutedRules.filter((r) => r !== id);
      saveSettings({ mutedRules: settings.mutedRules });
      renderMuted();
    });
    item.append(text, restore);
    list.append(item);
  }
}

async function renderStats() {
  const { total, byCategory } = await readStats(STATS_DAYS);
  byId("stats-total").textContent = total ? plural("popupStatsTotal", total) : t("popupStatsEmpty");
  const bars = byId("stats-bars");
  bars.replaceChildren();
  const max = Math.max(1, ...Object.values(byCategory));
  for (const [category, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    const item = document.createElement("li");
    item.className = "stats__bar";
    item.style.setProperty("--share", String(count / max));
    const label = document.createElement("span");
    label.textContent = categoryLabel(category);
    const value = document.createElement("span");
    value.textContent = String(count);
    item.append(label, value);
    bars.append(item);
  }
}

/** Ouverte dans un onglet (accueil ou options) plutôt que dans la barre d'outils. */
async function setUpPage() {
  if (await chrome.tabs.getCurrent()) document.body.classList.add("is-page");
  if (!new URLSearchParams(location.search).has("welcome")) return;
  byId("welcome").hidden = false;
  byId("stats").hidden = true;
  const done = byId("welcome-done");
  done.hidden = false;
  done.addEventListener("click", () => window.close());
}

translatePage();
await setUpPage();
renderState();
renderFilters();
renderSensitivity();
bindList(customInput, settings.customTerms, parseTerms, (terms) => {
  settings.customTerms = terms;
  saveSettings({ customTerms: terms });
});
bindList(
  allowedInput,
  settings.allowedHandles,
  parseHandles,
  (handles) => {
    settings.allowedHandles = handles;
    saveSettings({ allowedHandles: handles });
  },
  (h) => `@${h}`,
);
renderMuted();
renderStats();

enabledInput.addEventListener("change", () => {
  settings.enabled = enabledInput.checked;
  saveSettings({ enabled: settings.enabled });
  renderState();
});

// Si « Ce n'est pas de la haine » ou « Autoriser » sont utilisés pendant que la popup est ouverte.
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "local" || !(changes.mutedRules || changes.allowedHandles || changes.stats)) return;
  settings = await loadSettings();
  if (changes.mutedRules) renderMuted();
  if (changes.allowedHandles && document.activeElement !== allowedInput) {
    allowedInput.value = settings.allowedHandles.map((h) => `@${h}`).join("\n");
  }
  if (changes.stats) renderStats();
});
