/**
 * Vérifie que les images du dépôt ne portent pas de métadonnées : un éditeur
 * d'images y glisse facilement un nom d'auteur, une date, un chemin ou un lieu.
 *   PNG : signature valide et seulement les blocs IHDR, PLTE, tRNS, IDAT, IEND ;
 *   JPEG : refusé, ses blocs EXIF sont trop faciles à oublier ;
 *   SVG : pas de <metadata>, ni de RDF ou de XMP.
 * Seuls les fichiers suivis par git sont lus.
 *
 * Usage : node scripts/check-images.js
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_CHUNKS = new Set(["IHDR", "PLTE", "tRNS", "IDAT", "IEND"]);
const SVG_METADATA = /<metadata|rdf:|xmp/i;

/**
 * Les problèmes d'un PNG, vide s'il est propre.
 * @param {Buffer} data
 * @returns {string[]}
 */
function checkPng(data) {
  if (data.length < 8 || !data.subarray(0, 8).equals(PNG_SIGNATURE)) return ["signature PNG absente"];
  /** @type {string[]} */
  const problems = [];
  let offset = 8;
  let ended = false;
  while (offset + 8 <= data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.toString("latin1", offset + 4, offset + 8);
    if (!PNG_CHUNKS.has(type)) problems.push(`bloc ${type} non autorisé`);
    offset += 12 + length;
    if (type === "IEND") {
      ended = true;
      break;
    }
  }
  if (!ended || offset > data.length) problems.push("fichier tronqué, pas de bloc IEND complet");
  else if (offset < data.length) problems.push(`${data.length - offset} octets après le bloc IEND`);
  return problems;
}

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter((f) => f && existsSync(f));

/** @type {string[]} */
const errors = [];
let count = 0;
for (const file of files) {
  const lower = file.toLowerCase();
  if (lower.endsWith(".png")) {
    count++;
    for (const problem of checkPng(readFileSync(file))) errors.push(`${file} : ${problem}`);
  } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    count++;
    errors.push(`${file} : JPEG refusé, exporte l'image en PNG sans métadonnées`);
  } else if (lower.endsWith(".svg")) {
    count++;
    if (SVG_METADATA.test(readFileSync(file, "utf8"))) errors.push(`${file} : métadonnées (<metadata>, RDF ou XMP)`);
  }
}

if (errors.length) {
  for (const error of errors) console.error(error);
  console.error(`${errors.length} problème(s) dans les images. Retire les métadonnées avant de commiter.`);
  process.exit(1);
}
console.log(`Images : ${count} fichiers, aucune métadonnée.`);
