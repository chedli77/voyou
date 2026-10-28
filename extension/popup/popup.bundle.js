// extension/detection/categories.js
var CATEGORIES = [
  {
    id: "racism",
    label: "Racisme",
    description: "Insultes racistes, « retourne dans ton pays », xénophobie.",
    enabledByDefault: true
  },
  {
    id: "hate",
    label: "Autres haines",
    description: "Religion, homophobie et transphobie, handicap, sexisme.",
    enabledByDefault: true
  },
  {
    id: "threat",
    label: "Menaces",
    description: "Menaces de mort, appels à la violence.",
    enabledByDefault: true
  },
  {
    id: "insult",
    label: "Insultes",
    description: "Insultes adressées à quelqu'un.",
    enabledByDefault: true
  },
  {
    id: "profanity",
    label: "Vulgarité",
    description: "Jurons, même sans personne visée.",
    enabledByDefault: false
  }
];
var DEFAULT_CATEGORIES = CATEGORIES.filter((c) => c.enabledByDefault).map((c) => c.id);

// extension/settings.js
var SENSITIVITIES = [
  { id: "low", label: "Souple" },
  { id: "medium", label: "Équilibrée" },
  { id: "high", label: "Stricte" }
];
var DEFAULT_SETTINGS = {
  enabled: true,
  categories: DEFAULT_CATEGORIES,
  sensitivity: "medium",
  allowedHandles: []
};
var SETTING_KEYS = (
  /** @type {(keyof Settings)[]} */
  Object.keys(DEFAULT_SETTINGS)
);
var CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));
var SENSITIVITY_IDS = new Set(SENSITIVITIES.map((s) => s.id));
function parseHandles(value) {
  const items = Array.isArray(value) ? value : String(value ?? "").split(/[\s,;]+/);
  const handles = items.map((h) => String(h).trim().replace(/^@/, "").toLowerCase()).filter((h) => /^\w{1,15}$/.test(h));
  return [...new Set(handles)];
}
function sanitizeSettings(raw) {
  const categories = Array.isArray(raw.categories) ? (
    /** @type {Category[]} */
    raw.categories.filter((c) => CATEGORY_IDS.has(c))
  ) : DEFAULT_SETTINGS.categories;
  const sensitivity2 = (
    /** @type {Sensitivity} */
    SENSITIVITY_IDS.has(
      /** @type {Sensitivity} */
      raw.sensitivity
    ) ? raw.sensitivity : DEFAULT_SETTINGS.sensitivity
  );
  return {
    enabled: raw.enabled !== false,
    categories,
    sensitivity: sensitivity2,
    allowedHandles: parseHandles(raw.allowedHandles ?? [])
  };
}
async function loadSettings() {
  return sanitizeSettings(await chrome.storage.local.get(DEFAULT_SETTINGS));
}
function saveSettings(changes) {
  return chrome.storage.local.set(changes);
}

// extension/popup/popup.js
var byId = (id) => (
  /** @type {T} */
  document.getElementById(id)
);
var enabledInput = (
  /** @type {HTMLInputElement} */
  byId("enabled")
);
var enabledState = byId("enabled-state");
var filters = byId("filters");
var sensitivity = byId("sensitivity");
var allowed = (
  /** @type {HTMLTextAreaElement} */
  byId("allowed")
);
var settings = await loadSettings();
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
  row.querySelector(".toggle__label").textContent = category.label;
  row.querySelector(".toggle__description").textContent = category.description;
  const input = (
    /** @type {HTMLInputElement} */
    row.querySelector("input")
  );
  input.checked = settings.categories.includes(category.id);
  input.addEventListener("change", () => {
    const enabled = new Set(settings.categories);
    if (input.checked) enabled.add(category.id);
    else enabled.delete(category.id);
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
var allowedTimer = 0;
allowed.addEventListener("input", () => {
  window.clearTimeout(allowedTimer);
  allowedTimer = window.setTimeout(() => {
    settings.allowedHandles = parseHandles(allowed.value);
    saveSettings({ allowedHandles: settings.allowedHandles });
  }, 400);
});
allowed.addEventListener("blur", () => {
  allowed.value = parseHandles(allowed.value).map((h) => `@${h}`).join("\n");
});
enabledInput.addEventListener("change", () => {
  settings.enabled = enabledInput.checked;
  saveSettings({ enabled: settings.enabled });
  render();
});
render();
