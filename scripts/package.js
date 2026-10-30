/**
 * Prépare les zips à envoyer aux boutiques : build, eval, puis un zip par
 * navigateur avec les seuls fichiers chargés à l'exécution.
 *   dist/voyou-<version>-chrome.zip   Chrome Web Store
 *   dist/voyou-<version>-edge.zip     Microsoft Edge Add-ons (même contenu)
 *   dist/voyou-<version>-firefox.zip  Firefox Add-ons (manifest adapté)
 *
 * Usage : npm run package
 *         node scripts/package.js --no-build   zippe les bundles commités, sans build ni eval
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import manifest from "../extension/manifest.json" with { type: "json" };

// Seulement ce que le navigateur charge : les sources des bundles restent dans le dépôt.
const FILES = [
  "_locales",
  "icons",
  "popup/popup.html",
  "popup/popup.css",
  "popup/popup.bundle.js",
  "content/content.bundle.js",
  "content/content.css",
];

// FILES est tenu à la main : chaque fichier que le manifest ou la popup font charger doit être dans le zip.
const popupDir = dirname(manifest.action.default_popup);
const popupHtml = readFileSync(join("extension", manifest.action.default_popup), "utf8");
const LOADED = [
  ...Object.values(manifest.icons),
  ...Object.values(manifest.action.default_icon),
  manifest.action.default_popup,
  ...manifest.content_scripts.flatMap((script) => [...script.js, ...script.css]),
  `_locales/${manifest.default_locale}/messages.json`,
  ...[...popupHtml.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => join(popupDir, match[1])),
];

// Identifiant stable de l'extension sur Firefox Add-ons, sans lien avec une personne.
const FIREFOX_ID = "{be11bbce-dae7-4814-ab89-b78f26eeb496}";

/** @type {Record<string, (m: typeof manifest) => object>} */
const TARGETS = {
  chrome: (m) => m,
  edge: (m) => m,
  firefox: ({ minimum_chrome_version: _, ...m }) => ({
    ...m,
    browser_specific_settings: {
      gecko: { id: FIREFOX_ID, strict_min_version: "121.0", data_collection_permissions: { required: ["none"] } },
    },
  }),
};

const run = (/** @type {string} */ cmd, /** @type {string[]} */ args, cwd = ".") =>
  execFileSync(cmd, args, { cwd, stdio: "inherit" });

// La release zippe les bundles commités sans rien reconstruire : elle ne lance ainsi aucun code
// de dépendance npm avec ses droits d'écriture. Son job de vérification les a comparés à un build neuf.
if (!process.argv.includes("--no-build")) {
  run("node", ["scripts/build.js"]);
  run("node", ["tests/detection/eval.js"]);
}
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
  const missing = LOADED.filter((file) => !existsSync(join(stage, file)));
  if (missing.length) throw new Error(`Absents du zip ${target}, à ajouter à FILES : ${missing.join(", ")}`);
  run("zip", ["-qrX", `../../${zip}`, ".", "-x", "*.DS_Store"], stage);
  console.log(`Prêt : ${zip}`);
}
