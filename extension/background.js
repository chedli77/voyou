/**
 * Script d'arrière-plan : il ne fait qu'une chose, ouvrir l'écran d'accueil
 * à la première installation pour choisir ses filtres.
 */
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup/popup.html?welcome") });
  }
});
