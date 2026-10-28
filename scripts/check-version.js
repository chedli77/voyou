/**
 * Vérifie la version de l'extension :
 *   toujours : manifest.json et package.json portent la même version ;
 *   avec --newer-than-release : elle est plus récente que le dernier tag vX.Y.Z,
 *   sinon le merge sur main ne publierait rien.
 */
import { execFileSync } from "node:child_process";
import manifest from "../extension/manifest.json" with { type: "json" };
import pkg from "../package.json" with { type: "json" };

/** @param {string} v */
const parse = (v) => v.split(".").map(Number);

/**
 * @param {string} a
 * @param {string} b
 */
function compare(a, b) {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return (x[i] ?? 0) - (y[i] ?? 0);
  return 0;
}

const version = manifest.version;
if (pkg.version !== version) {
  console.error(`Versions différentes : manifest.json ${version}, package.json ${pkg.version}.`);
  process.exit(1);
}

if (process.argv.includes("--newer-than-release")) {
  const tags = execFileSync("git", ["tag", "--list", "v*.*.*"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    .map((t) => t.slice(1));
  const latest = tags.sort(compare).at(-1);
  if (latest && compare(version, latest) <= 0) {
    console.error(`La version ${version} n'est pas plus récente que la dernière publiée (${latest}) : monte-la.`);
    process.exit(1);
  }
  console.log(`Version ${version} : prête à publier${latest ? ` (dernière : ${latest})` : ""}.`);
} else {
  console.log(`Version ${version}.`);
}
