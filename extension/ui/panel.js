/**
 * Panneau des réglages : filtres, sensibilité, mots à masquer, comptes
 * autorisés, règles ignorées et statistiques. Le même composant s'ouvre
 * depuis le compteur flottant sur X et depuis l'icône de la barre d'outils.
 *
 * Chaque changement est enregistré tout de suite dans chrome.storage, et le
 * script de page l'applique sans recharger. Le panneau se met aussi à jour
 * quand un réglage change ailleurs (autre onglet, bouton sous un tweet).
 */
import { CATEGORIES } from "../detection/categories.js";
import { LISTS } from "../detection/score.js";
import { categoryLabel, plural, t } from "../i18n.js";
import { SENSITIVITIES, loadSettings, parseHandles, parseTerms, saveSettings } from "../settings.js";
import { readStats } from "../stats.js";
import PANEL_CSS from "./panel.css";

const STATS_DAYS = 7;
const TYPING_DELAY_MS = 400;

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

/** Règles connues, pour afficher les règles ignorées de façon lisible. */
const RULES = new Map(
  Object.values(LISTS).flatMap((list) => [
    ...list.terms.map((e) => /** @type {const} */ ([e.id, `${categoryLabel(e.category)} : « ${e.terms[0]} »`])),
    ...list.patterns.map((e) => /** @type {const} */ ([e.id, `${categoryLabel(e.category)} : ${e.note}`])),
  ]),
);

/**
 * Zone de texte enregistrée pendant la frappe, et remise au propre en sortant.
 * @param {HTMLTextAreaElement} input
 * @param {(value: string) => string[]} parse
 * @param {(values: string[]) => void} save
 * @param {(value: string) => string} format
 */
function bindList(input, parse, save, format) {
  let timer = 0;
  input.addEventListener("input", () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => save(parse(input.value)), TYPING_DELAY_MS);
  });
  input.addEventListener("blur", () => {
    input.value = parse(input.value).map(format).join("\n");
  });
}

/**
 * Ajoute le panneau (et ses styles) dans root.
 * @param {ShadowRoot | HTMLElement} root
 * @param {PanelOptions} options
 * @returns {Promise<Panel>}
 */
export async function mountPanel(root, { pageCount, onClose, dark }) {
  let settings = await loadSettings();
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

  // Infos : sur la page en cours et sur les 7 derniers jours.
  const pageLine = h("p", { className: "stats__page" });
  const total = h("p", { className: "stats__total" });
  const bars = h("ul", { className: "stats__bars" });
  const stats = h("section", { className: "stats", attrs: { "aria-live": "polite" } }, [
    ...(pageCount ? [pageLine] : []),
    h("p", { className: "section__title", text: t("popupStats") }),
    total,
    bars,
  ]);

  // Filtres.
  const filters = h("fieldset", { className: "section" }, [
    h("legend", { className: "section__title", text: t("popupHide") }),
  ]);
  for (const category of CATEGORIES) {
    const input = h("input", { className: "toggle__input", attrs: { type: "checkbox" } });
    input.checked = settings.categories.includes(category.id);
    input.addEventListener("change", () => {
      const on = new Set(settings.categories);
      if (input.checked) on.add(category.id);
      else on.delete(category.id);
      // Garde l'ordre de CATEGORIES pour un stockage stable.
      saveSettings({ categories: CATEGORIES.map((c) => c.id).filter((id) => on.has(id)) });
    });
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
  for (const level of SENSITIVITIES) {
    const radio = h("input", { attrs: { type: "radio", name: radioName, value: level } });
    radio.checked = settings.sensitivity === level;
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
  const allowed = textArea("allowed", "@compte");
  const textSection = (
    /** @type {string} */ title,
    /** @type {HTMLTextAreaElement} */ area,
    /** @type {string} */ hint,
  ) =>
    h("label", { className: "section" }, [
      h("span", { className: "section__title", text: t(title) }),
      area,
      h("span", { className: "section__hint", text: t(hint) }),
    ]);
  custom.value = settings.customTerms.join("\n");
  allowed.value = settings.allowedHandles.map((handle) => `@${handle}`).join("\n");
  bindList(
    custom,
    parseTerms,
    (customTerms) => saveSettings({ customTerms }),
    (v) => v,
  );
  bindList(
    allowed,
    parseHandles,
    (allowedHandles) => saveSettings({ allowedHandles }),
    (v) => `@${v}`,
  );

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
    stats,
    filters,
    sensitivity,
    textSection("popupCustom", custom, "popupCustomHint"),
    textSection("popupAllowed", allowed, "popupAllowedHint"),
    muted,
    h("p", { className: "panel__footer", text: t("popupFooter") }),
  ]);
  root.append(el);

  enabled.addEventListener("change", () => saveSettings({ enabled: enabled.checked }));

  function renderState() {
    enabled.checked = settings.enabled;
    state.textContent = settings.enabled ? t("popupOn") : t("popupOff");
    el.classList.toggle("is-off", !settings.enabled);
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
        return h("li", { className: "muted__item" }, [h("span", { text: RULES.get(id) ?? id }), restore]);
      }),
    );
  }

  async function renderStats() {
    const week = await readStats(STATS_DAYS);
    total.textContent = week.total ? plural("popupStatsTotal", week.total) : t("popupStatsEmpty");
    const max = Math.max(1, ...Object.values(week.byCategory));
    bars.replaceChildren(
      ...Object.entries(week.byCategory)
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
    if (pageCount) pageLine.textContent = `${t("panelPage")} : ${plural("hudCount", pageCount())}`;
  }

  /** @param {boolean} value */
  function setDark(value) {
    el.classList.toggle("is-dark", value);
  }

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== "local") return;
    if (changes.stats) renderStats();
    if (!(changes.enabled || changes.mutedRules || changes.allowedHandles || changes.customTerms)) return;
    settings = await loadSettings();
    renderState();
    renderMuted();
    // Ne pas écraser ce que l'utilisateur est en train de taper.
    const active = root instanceof ShadowRoot ? root.activeElement : document.activeElement;
    if (active !== allowed) allowed.value = settings.allowedHandles.map((handle) => `@${handle}`).join("\n");
    if (active !== custom) custom.value = settings.customTerms.join("\n");
  });

  setDark(dark);
  renderState();
  renderMuted();
  refreshCount();
  renderStats();
  return { el, refreshCount, setDark };
}
