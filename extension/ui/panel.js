/**
 * Panneau des réglages : filtres, sensibilité, mots à masquer, comptes
 * autorisés, règles ignorées et statistiques. Le même composant s'ouvre
 * depuis le compteur flottant sur X et depuis l'icône de la barre d'outils.
 *
 * Chaque changement est enregistré dans chrome.storage, et le script de page
 * l'applique sans recharger. Le panneau se met aussi à jour quand un réglage
 * change ailleurs (autre panneau, autre onglet, bouton sous un tweet).
 */
import { CATEGORIES } from "../detection/categories.js";
import { LISTS } from "../detection/lists.js";
import { categoryLabel, getLocale, plural, t } from "../i18n.js";
import {
  MAX_CUSTOM_TERMS,
  MAX_TERM_LENGTH,
  SENSITIVITIES,
  SETTING_KEYS,
  loadSettings,
  parseHandles,
  parseTerms,
  saveSettings,
} from "../settings.js";
import { readStats } from "../stats.js";
import PANEL_CSS from "./panel.css";

const STATS_DAYS = 7;
const TYPING_DELAY_MS = 400;
// L'accès à x.com est une permission que l'utilisateur peut retirer, et que
// Firefox n'accorde pas à l'installation avant sa version 127. twitter.com
// redirige vers x.com : c'est cet accès qui décide si Voyou masque quelque chose.
const X_ACCESS = { origins: ["https://x.com/*"] };

/**
 * @typedef {object} PanelOptions
 * @property {() => number} [pageCount] éléments masqués sur la page, affiché si fourni
 * @property {() => void} [onClose] affiche un bouton « Réduire » qui l'appelle
 * @property {boolean} dark
 *
 * @typedef {object} Panel
 * @property {HTMLElement} el
 * @property {() => void} refreshCount met à jour le nombre masqué sur la page
 * @property {(dark: boolean) => void} setDark
 * @property {() => void} destroy enregistre la saisie en cours, retire le panneau et cesse d'écouter le stockage
 */

/**
 * Crée un élément, sans innerHTML.
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag
 * @param {{ className?: string, text?: string, attrs?: Record<string, string> }} [props]
 * @param {(Node | string)[]} [children]
 * @returns {HTMLElementTagNameMap[K]}
 */
function h(tag, { className, text, attrs } = {}, children = []) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  for (const [name, value] of Object.entries(attrs ?? {})) el.setAttribute(name, value);
  el.append(...children);
  return el;
}

/**
 * Libellé lisible d'une règle ignorée, dans la langue de l'interface : le mot
 * pour une règle de mots, la langue de sa liste pour une tournure.
 * @param {string} id
 */
function ruleLabel(id) {
  for (const [lang, list] of Object.entries(LISTS)) {
    const term = list.terms.find((e) => e.id === id);
    if (term) return t("mutedTerm", categoryLabel(term.category), term.terms[0]);
    const pattern = list.patterns.find((e) => e.id === id);
    if (!pattern) continue;
    if (lang === "multi") return t("mutedPatternAnyLanguage", categoryLabel(pattern.category));
    const language = new Intl.DisplayNames([getLocale()], { type: "language" }).of(lang) ?? lang;
    return t("mutedPattern", categoryLabel(pattern.category), language);
  }
  return id;
}

/** Le script de page n'a pas chrome.permissions : s'il tourne, c'est qu'il a l'accès. */
const hasAccess = async () => !chrome.permissions || chrome.permissions.contains(X_ACCESS);

/**
 * Zone de texte, une valeur par ligne. Pendant la frappe, la ligne du curseur
 * attend d'être finie : un mot en train d'être écrit (« sa » pour « sale ») ne
 * doit rien masquer. Elle est enregistrée quand on passe à la ligne, quand on
 * quitte le champ, ou par flush().
 * @param {HTMLTextAreaElement} input
 * @param {object} list
 * @param {(value: string) => string[]} list.parse
 * @param {(value: string) => string} list.format
 * @param {() => string[]} list.saved valeurs enregistrées
 * @param {(values: string[]) => void} list.save
 */
function bindList(input, { parse, format, saved, save }) {
  let timer = 0;
  // Vrai tant qu'une partie de la saisie n'est pas enregistrée.
  let dirty = false;
  /** @param {string[]} values */
  const show = (values) => {
    input.value = values.map(format).join("\n");
  };
  /** @param {string} text */
  const commit = (text) => {
    const values = parse(text);
    if (values.join("\n") !== saved().join("\n")) save(values);
  };
  /** Enregistre tout de suite la saisie en attente, ligne en cours comprise. */
  const flush = () => {
    window.clearTimeout(timer);
    if (!dirty) return;
    dirty = false;
    commit(input.value);
  };
  input.addEventListener("input", () => {
    dirty = true;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const lines = input.value.split("\n");
      const caretLine = input.value.slice(0, input.selectionStart).split("\n").length - 1;
      // Une ligne déjà enregistrée reste comptée quand le curseur y revient
      // (après avoir effacé la ligne suivante, par exemple).
      const unfinished = parse(lines[caretLine]).some((value) => !saved().includes(value));
      commit(unfinished ? lines.filter((_, i) => i !== caretLine).join("\n") : input.value);
    }, TYPING_DELAY_MS);
  });
  input.addEventListener("blur", () => {
    // La saisie, remise au propre, ou ce qu'un autre panneau a enregistré pendant qu'on était dans le champ.
    const values = dirty ? parse(input.value) : saved();
    flush();
    show(values);
  });
  return {
    flush,
    /** Affiche les valeurs enregistrées, sauf dans le champ où l'utilisateur écrit. */
    render() {
      if (!input.matches(":focus")) show(saved());
    },
  };
}

/**
 * Ajoute le panneau (et ses styles) dans root.
 * @param {ShadowRoot | HTMLElement} root
 * @param {PanelOptions} options
 * @returns {Promise<Panel>}
 */
export async function mountPanel(root, { pageCount, onClose, dark }) {
  let settings = await loadSettings();
  let access = await hasAccess();
  // Une fois l'accès manquant, le conseil de recharger X reste affiché : quand
  // l'accès revient, le script n'est pas ajouté aux onglets déjà ouverts.
  let accessMissing = !access;
  root.append(h("style", { text: PANEL_CSS }));

  // En-tête : nom, interrupteur général, bouton pour réduire.
  const enabled = h("input", { attrs: { type: "checkbox", role: "switch", "aria-label": t("popupToggle") } });
  const header = h("header", { className: "panel__header" }, [
    h("div", {}, [
      h("p", { className: "panel__title", text: "Voyou" }),
      h("p", { className: "panel__subtitle", text: t("popupSubtitle") }),
    ]),
    h("label", { className: "switch", attrs: { title: t("popupToggle") } }, [
      enabled,
      h("span", { className: "switch__track", attrs: { "aria-hidden": "true" } }),
      h("span", { className: "switch__thumb", attrs: { "aria-hidden": "true" } }),
    ]),
  ]);
  if (onClose) {
    const close = h("button", { className: "panel__close", text: t("panelClose"), attrs: { type: "button" } });
    close.addEventListener("click", onClose);
    header.append(close);
  }
  const state = h("p", { className: "panel__state", attrs: { "aria-live": "polite" } });

  // Accès à x.com, quand il manque (popup seulement).
  const grant = h("button", { className: "panel__grant", text: t("popupGrant"), attrs: { type: "button" } });
  // Firefox n'accepte la demande que pendant le clic : rien d'asynchrone avant.
  grant.addEventListener("click", () => chrome.permissions.request(X_ACCESS));
  const accessBox = h("div", { className: "panel__access" }, [
    grant,
    h("p", { className: "section__hint", text: t("popupGrantHint") }),
  ]);

  // Infos : sur la page en cours et sur les derniers jours.
  const pageLine = h("p", { className: "stats__page" });
  const total = h("p", { className: "stats__total" });
  const bars = h("ul", { className: "stats__bars" });
  const stats = h("section", { className: "stats" }, [
    ...(pageCount ? [pageLine] : []),
    h("p", { className: "section__title", text: t("popupStats", STATS_DAYS) }),
    total,
    bars,
  ]);

  // Filtres.
  const filters = h("fieldset", { className: "section" }, [
    h("legend", { className: "section__title", text: t("popupHide") }),
  ]);
  /** @type {Map<import("../detection/categories.js").Category, HTMLInputElement>} */
  const categoryInputs = new Map();
  for (const category of CATEGORIES) {
    const input = h("input", { className: "toggle__input", attrs: { type: "checkbox" } });
    categoryInputs.set(category.id, input);
    // On lit les cases affichées, pas settings : un second clic peut arriver avant
    // que le premier revienne du stockage. La Map garde l'ordre de CATEGORIES.
    input.addEventListener("change", () =>
      saveSettings({ categories: [...categoryInputs].filter(([, box]) => box.checked).map(([id]) => id) }),
    );
    filters.append(
      h("label", { className: "toggle" }, [
        h("span", { className: "toggle__text" }, [
          h("span", { className: "toggle__label", text: categoryLabel(category.id) }),
          h("span", { className: "toggle__description", text: t(`category_${category.id}_description`) }),
        ]),
        input,
      ]),
    );
  }

  // Sensibilité.
  const levels = h("div", { className: "segmented" });
  const radioName = `voyou-sensitivity-${Math.random().toString(36).slice(2)}`;
  /** @type {Map<import("../detection/score.js").Sensitivity, HTMLInputElement>} */
  const levelInputs = new Map();
  for (const level of SENSITIVITIES) {
    const radio = h("input", { attrs: { type: "radio", name: radioName, value: level } });
    levelInputs.set(level, radio);
    radio.addEventListener("change", () => saveSettings({ sensitivity: level }));
    levels.append(h("label", { className: "segmented__option" }, [radio, t(`sensitivity_${level}`)]));
  }
  const sensitivity = h("fieldset", { className: "section" }, [
    h("legend", { className: "section__title", text: t("popupSensitivity") }),
    levels,
    h("p", { className: "section__hint", text: t("popupSensitivityHint") }),
  ]);

  // Mots à masquer et comptes autorisés.
  const textArea = (/** @type {string} */ field, /** @type {string} */ placeholder) =>
    h("textarea", { attrs: { rows: "2", spellcheck: "false", autocomplete: "off", placeholder, "data-field": field } });
  const custom = textArea("custom", "");
  const allowed = textArea("allowed", t("popupAllowedPlaceholder"));
  const textSection = (
    /** @type {string} */ title,
    /** @type {HTMLTextAreaElement} */ area,
    /** @type {string} */ hint,
  ) =>
    h("label", { className: "section" }, [
      h("span", { className: "section__title", text: title }),
      area,
      h("span", { className: "section__hint", text: hint }),
    ]);
  const lists = [
    bindList(custom, {
      parse: parseTerms,
      format: (term) => term,
      saved: () => settings.customTerms,
      save: (customTerms) => saveSettings({ customTerms }),
    }),
    bindList(allowed, {
      parse: parseHandles,
      format: (handle) => `@${handle}`,
      saved: () => settings.allowedHandles,
      save: (allowedHandles) => saveSettings({ allowedHandles }),
    }),
  ];
  // La popup se ferme d'un clic à côté, parfois sans que le champ ait été quitté.
  const flushLists = () => lists.forEach((list) => list.flush());
  addEventListener("pagehide", flushLists);

  // Règles ignorées.
  const mutedList = h("ul", { className: "muted" });
  const muted = h("section", { className: "section" }, [
    h("p", { className: "section__title", text: t("popupMuted") }),
    mutedList,
    h("p", { className: "section__hint", text: t("popupMutedHint") }),
  ]);

  const el = h("section", { className: "panel", attrs: { "aria-label": "Voyou" } }, [
    header,
    state,
    accessBox,
    stats,
    filters,
    sensitivity,
    textSection(t("popupCustom"), custom, t("popupCustomHint", MAX_CUSTOM_TERMS, MAX_TERM_LENGTH)),
    textSection(t("popupAllowed"), allowed, t("popupAllowedHint")),
    muted,
    h("p", { className: "panel__footer", text: t("popupFooter") }),
  ]);
  root.append(el);

  enabled.addEventListener("change", () => saveSettings({ enabled: enabled.checked }));

  function renderState() {
    enabled.checked = settings.enabled;
    const text = !settings.enabled ? t("popupOff") : access ? t("popupOn") : t("popupNoAccess");
    // Région lue par les lecteurs d'écran : un texte réécrit à l'identique serait relu.
    if (state.textContent !== text) state.textContent = text;
    accessBox.hidden = !accessMissing;
    grant.hidden = access;
  }

  function renderChoices() {
    for (const [id, input] of categoryInputs) input.checked = settings.categories.includes(id);
    for (const [level, radio] of levelInputs) radio.checked = settings.sensitivity === level;
  }

  function renderMuted() {
    muted.hidden = settings.mutedRules.length === 0;
    mutedList.replaceChildren(
      ...settings.mutedRules.map((id) => {
        const restore = h("button", {
          className: "muted__restore",
          text: t("popupMutedRestore"),
          attrs: { type: "button" },
        });
        restore.addEventListener("click", () =>
          saveSettings({ mutedRules: settings.mutedRules.filter((rule) => rule !== id) }),
        );
        return h("li", { className: "muted__item" }, [h("span", { text: ruleLabel(id) }), restore]);
      }),
    );
  }

  function render() {
    renderState();
    renderChoices();
    renderMuted();
    for (const list of lists) list.render();
  }

  async function renderStats() {
    const recent = await readStats(STATS_DAYS);
    total.textContent = recent.total ? plural("popupStatsTotal", recent.total) : t("popupStatsEmpty", STATS_DAYS);
    const max = Math.max(1, ...Object.values(recent.byCategory));
    bars.replaceChildren(
      ...Object.entries(recent.byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => {
          const bar = h("li", { className: "stats__bar" }, [
            h("span", { text: categoryLabel(category) }),
            h("span", { text: String(count) }),
          ]);
          bar.style.setProperty("--share", String(count / max));
          return bar;
        }),
    );
  }

  function refreshCount() {
    if (pageCount) pageLine.textContent = t("panelPage", plural("hudCount", pageCount()));
  }

  /** @param {boolean} value */
  function setDark(value) {
    el.classList.toggle("is-dark", value);
  }

  /** @param {{ [key: string]: chrome.storage.StorageChange }} changes @param {string} area */
  async function onStorageChange(changes, area) {
    if (area !== "local") return;
    if (changes.stats) renderStats();
    if (!SETTING_KEYS.some((key) => key in changes)) return;
    settings = await loadSettings();
    render();
  }
  chrome.storage.onChanged.addListener(onStorageChange);

  async function onAccessChange() {
    access = await hasAccess();
    if (!access) accessMissing = true;
    renderState();
  }
  chrome.permissions?.onAdded.addListener(onAccessChange);
  chrome.permissions?.onRemoved.addListener(onAccessChange);

  function destroy() {
    flushLists();
    removeEventListener("pagehide", flushLists);
    chrome.storage.onChanged.removeListener(onStorageChange);
    chrome.permissions?.onAdded.removeListener(onAccessChange);
    chrome.permissions?.onRemoved.removeListener(onAccessChange);
    el.remove();
  }

  setDark(dark);
  render();
  refreshCount();
  renderStats();
  return { el, refreshCount, setDark, destroy };
}
