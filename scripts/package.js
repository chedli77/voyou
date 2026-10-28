/**
 * Prépare les zips à envoyer aux boutiques : build, eval, puis un zip par
 * navigateur avec les seuls fichiers chargés à l'exécution.
 *   dist/voyou-<version>-chrome.zip   Chrome Web Store
 *   dist/voyou-<version>-edge.zip     Microsoft Edge Add-ons (même contenu)
 *   dist/voyou-<version>-firefox.zip  Firefox Add-ons (manifest adapté)
 *
 * Usage : npm run package
 */
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import manifest from "../extension/manifest.json" with { type: "json" };

// Seulement ce que le navigateur charge : les sources des bundles restent dans le dépôt.
const FILES = [
  "_locales",
  "background.js",
  "icons",
  "popup/popup.html",
  "popup/popup.css",
  "popup/popup.bundle.js",
  "content/content.bundle.js",
  "content/content.css",
];

// Identifiant stable de l'extension sur Firefox Add-ons, sans lien avec une personne.
const FIREFOX_ID = "{be11bbce-dae7-4814-ab89-b78f26eeb496}";

/** @type {Record<string, (m: typeof manifest) => object>} */
const TARGETS = {
  chrome: (m) => m,
  edge: (m) => m,
  // Firefox n'a pas de service worker d'extension : le même script tourne en page de fond.
  firefox: ({ minimum_chrome_version: _, background, ...m }) => ({
    ...m,
    background: { scripts: [background.service_worker] },
    browser_specific_settings: {
      gecko: { id: FIREFOX_ID, strict_min_version: "121.0", data_collection_permissions: { required: ["none"] } },
    },
  }),
};

const run = (/** @type {string} */ cmd, /** @type {string[]} */ args, cwd = ".") =>
  execFileSync(cmd, args, { cwd, stdio: "inherit" });

run("node", ["scripts/build.js"]);
run("node", ["tests/detection/eval.js"]);
for (const [target, adapt] of Object.entries(TARGETS)) {
  const stage = join("dist", target);
  const zip = `dist/voyou-${manifest.version}-${target}.zip`;
  rmSync(stage, { recursive: true, force: true });
  rmSync(zip, { force: true });
  for (const file of FILES) {
    mkdirSync(join(stage, dirname(file)), { recursive: true });
    cpSync(join("extension", file), join(stage, file), { recursive: true });
  }
  writeFileSync(join(stage, "manifest.json"), `${JSON.stringify(adapt(manifest), null, 2)}\n`);
  run("zip", ["-qrX", `../../${zip}`, ".", "-x", "*.DS_Store"], stage);
  console.log(`Prêt : ${zip}`);
}
