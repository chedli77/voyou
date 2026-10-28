/**
 * Construit les deux scripts que Chrome charge :
 *   content/content.bundle.js, injecté dans X (script classique : les content
 *   scripts ne peuvent pas être des modules ES) ;
 *   popup/popup.bundle.js, la popup de la barre d'outils.
 *
 * Les bundles sont commités pour qu'on puisse charger extension/ dans Chrome
 * sans rien installer. Avec --check, vérifie qu'ils sont à jour (CI).
 */
import { readFile } from "node:fs/promises";
import { build } from "esbuild";

const check = process.argv.includes("--check");

/** @type {{ entry: string, outfile: string, format: "iife" | "esm" }[]} */
const BUNDLES = [
  { entry: "extension/content/main.js", outfile: "extension/content/content.bundle.js", format: "iife" },
  { entry: "extension/popup/popup.js", outfile: "extension/popup/popup.bundle.js", format: "esm" },
];

let stale = 0;
for (const { entry, outfile, format } of BUNDLES) {
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    format,
    target: "chrome110",
    charset: "utf8",
    legalComments: "none",
    write: !check,
    outfile,
  });
  if (!check) {
    console.log(`Construit : ${outfile}`);
    continue;
  }
  const committed = await readFile(outfile, "utf8").catch(() => "");
  if (committed !== result.outputFiles?.[0]?.text) {
    console.error(`${outfile} n'est pas à jour : lance npm run build et commite le résultat.`);
    stale++;
  }
}
if (check && !stale) console.log("Les bundles sont à jour.");
process.exitCode = stale ? 1 : 0;
