/**
 * Popup de la barre d'outils. Chaque changement est enregistré tout de suite
 * dans chrome.storage ; le script injecté dans X l'applique sans recharger.
 */
import { CATEGORIES } from "../detection/categories.js";
import { SENSITIVITIES, loadSettings, parseHandles, saveSettings } from "../settings.js";

/**
 * @template {HTMLElement} T
 * @param {string} id
 * @returns {T}
 */
const byId = (id) => /** @type {T} */ (document.getElementById(id));

const enabledInput = /** @type {HTMLInputElement} */ (byId("enabled"));
const enabledState = byId("enabled-state");
const filters = byId("filters");
const sensitivity = byId("sensitivity");
const allowed = /** @type {HTMLTextAreaElement} */ (byId("allowed"));

let settings = await loadSettings();

function render() {
  enabledInput.checked = settings.enabled;
  enabledState.textContent = settings.enabled ? "Activé sur x.com" : "Désactivé : rien n'est masqué";
  document.body.classList.toggle("is-off", !settings.enabled);
}

for (const category of CATEGORIES) {
  const row = document.createElement("label");
  row.className = "toggle";
  row.innerHTML = `
    <span class="toggle__text">
      <span class="toggle__label"></span>
      <span class="toggle__description"></span>
    </span>
    <input type="checkbox" class="toggle__input" />`;
  /** @type {HTMLElement} */ (row.querySelector(".toggle__label")).textContent = category.label;
  /** @type {HTMLElement} */ (row.querySelector(".toggle__description")).textContent = category.description;
  const input = /** @type {HTMLInputElement} */ (row.querySelector("input"));
  input.checked = settings.categories.includes(category.id);
  input.addEventListener("change", () => {
    const enabled = new Set(settings.categories);
    if (input.checked) enabled.add(category.id);
    else enabled.delete(category.id);
    // Garde l'ordre de CATEGORIES pour un stockage stable.
    settings.categories = CATEGORIES.map((c) => c.id).filter((id) => enabled.has(id));
    saveSettings({ categories: settings.categories });
  });
  filters.append(row);
}

for (const option of SENSITIVITIES) {
  const label = document.createElement("label");
  label.className = "segmented__option";
  const input = document.createElement("input");
  input.type = "radio";
  input.name = "sensitivity";
  input.value = option.id;
  input.checked = settings.sensitivity === option.id;
  input.addEventListener("change", () => {
    settings.sensitivity = option.id;
    saveSettings({ sensitivity: option.id });
  });
  label.append(input, option.label);
  sensitivity.append(label);
}

allowed.value = settings.allowedHandles.map((h) => `@${h}`).join("\n");
let allowedTimer = 0;
allowed.addEventListener("input", () => {
  window.clearTimeout(allowedTimer);
  allowedTimer = window.setTimeout(() => {
    settings.allowedHandles = parseHandles(allowed.value);
    saveSettings({ allowedHandles: settings.allowedHandles });
  }, 400);
});
// Remet la liste au propre (un @compte par ligne) en quittant le champ.
allowed.addEventListener("blur", () => {
  allowed.value = parseHandles(allowed.value)
    .map((h) => `@${h}`)
    .join("\n");
});

enabledInput.addEventListener("change", () => {
  settings.enabled = enabledInput.checked;
  saveSettings({ enabled: settings.enabled });
  render();
});

render();
