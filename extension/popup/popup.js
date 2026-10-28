/**
 * Popup de la barre d'outils : un seul réglage pour l'instant, activé ou non.
 * Le content script écoute chrome.storage et applique le changement tout de suite.
 */
const toggle = /** @type {HTMLInputElement} */ (document.getElementById("enabled"));
const state = /** @type {HTMLElement} */ (document.getElementById("toggle-state"));

function showState() {
  state.textContent = toggle.checked ? "Activé" : "Désactivé";
}

const { enabled } = await chrome.storage.local.get({ enabled: true });
toggle.checked = enabled !== false;
showState();

toggle.addEventListener("change", () => {
  chrome.storage.local.set({ enabled: toggle.checked });
  showState();
});
