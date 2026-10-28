/**
 * Popup de la barre d'outils : le même panneau de réglages que celui du
 * module flottant sur X, au thème du système.
 */
import { mountPanel } from "../ui/panel.js";

const dark = matchMedia("(prefers-color-scheme: dark)");
document.documentElement.lang = chrome.i18n.getUILanguage().split("-")[0];
const panel = await mountPanel(document.body, { dark: dark.matches });
dark.addEventListener("change", (event) => panel.setDark(event.matches));
