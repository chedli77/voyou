/**
 * Prépare le zip à envoyer sur le Chrome Web Store : build, eval, puis zip
 * des seuls fichiers utiles à l'exécution (pas les sources du bundle).
 * L'envoi sur le Store se fait à la main, depuis le tableau de bord développeur.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import manifest from "../extension/manifest.json" with { type: "json" };

// Seulement ce que Chrome charge : les sources des bundles restent dans le dépôt.
const FILES = [
  "manifest.json",
  "icons",
  "popup/popup.html",
  "popup/popup.css",
  "popup/popup.bundle.js",
  "content/content.bundle.js",
  "content/content.css",
];
const out = `dist/voyou-${manifest.version}-store.zip`;

const run = (/** @type {string} */ cmd, /** @type {string[]} */ args, cwd = ".") =>
  execFileSync(cmd, args, { cwd, stdio: "inherit" });

run("node", ["scripts/build.js"]);
run("node", ["tests/detection/eval.js"]);
mkdirSync("dist", { recursive: true });
rmSync(out, { force: true });
run("zip", ["-qr", `../${out}`, ...FILES, "-x", "*.DS_Store"], "extension");
console.log(`Prêt : ${out}`);
