/**
 * Construit extension/content/content.bundle.js, le seul script que Chrome
 * charge sur X. Les content scripts ne peuvent pas être des modules ES : on
 * regroupe tout dans un seul fichier classique (IIFE).
 *
 * Le bundle est commité pour qu'on puisse charger extension/ dans Chrome
 * sans rien installer. Avec --check, vérifie qu'il est à jour (CI).
 */
import { readFile } from "node:fs/promises";
import { build } from "esbuild";

const OUTFILE = "extension/content/content.bundle.js";
const check = process.argv.includes("--check");

const result = await build({
  entryPoints: ["extension/content/main.js"],
  bundle: true,
  format: "iife",
  target: "chrome110",
  charset: "utf8",
  legalComments: "none",
  write: !check,
  outfile: OUTFILE,
});

if (check) {
  const committed = await readFile(OUTFILE, "utf8").catch(() => "");
  if (committed !== result.outputFiles?.[0]?.text) {
    console.error(`${OUTFILE} n'est pas à jour : lance npm run build et commite le résultat.`);
    process.exit(1);
  }
  console.log(`${OUTFILE} est à jour.`);
} else {
  console.log(`Construit : ${OUTFILE}`);
}
