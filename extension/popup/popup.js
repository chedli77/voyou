/**
 * Popup de la barre d'outils : le même panneau de réglages que celui du
 * module flottant sur X, au thème du système et dans la dernière langue de X
 * vue par le script de page.
 */
import { getLocale, setLocale } from "../i18n.js";
import { mountPanel } from "../ui/panel.js";

const { uiLang } = await chrome.storage.local.get("uiLang");
setLocale(typeof uiLang === "string" ? uiLang : navigator.language);

const dark = matchMedia("(prefers-color-scheme: dark)");
document.documentElement.lang = getLocale();
const panel = await mountPanel(document.body, { dark: dark.matches });
dark.addEventListener("change", (event) => panel.setDark(event.matches));
