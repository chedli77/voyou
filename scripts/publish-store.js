/**
 * Envoie un zip au Chrome Web Store (API V2) puis le soumet à la validation.
 * Lancé par .github/workflows/release.yml, qui fournit un jeton d'accès court
 * obtenu par fédération d'identité : rien n'est stocké.
 *
 * Variables : TOKEN, PUBLISHER (id d'éditeur), ITEM (id de l'extension).
 * Usage : node scripts/publish-store.js dist/voyou-X.Y.Z-store.zip
 */
import { readFile } from "node:fs/promises";

const API = "https://chromewebstore.googleapis.com";
const { TOKEN, PUBLISHER, ITEM } = process.env;
const zipPath = process.argv[2];
if (!TOKEN || !PUBLISHER || !ITEM || !zipPath) {
  console.error("TOKEN, PUBLISHER, ITEM et le chemin du zip sont obligatoires.");
  process.exit(1);
}

const item = `publishers/${PUBLISHER}/items/${ITEM}`;
const headers = { Authorization: `Bearer ${TOKEN}` };

/**
 * @param {string} url
 * @param {RequestInit} [init]
 * @returns {Promise<any>}
 */
async function call(url, init = {}) {
  const response = await fetch(url, { ...init, headers: { ...headers, ...init.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${init.method ?? "GET"} ${url} : ${response.status} ${JSON.stringify(body)}`);
  return body;
}

const upload = await call(`${API}/upload/v2/${item}:upload`, {
  method: "POST",
  headers: { "Content-Type": "application/zip" },
  body: await readFile(zipPath),
});
/** @type {string} */
let state = upload.uploadState;
// Le Store traite parfois l'envoi en arrière-plan : on attend au plus deux minutes.
// La doc de media.upload parle de UPLOAD_IN_PROGRESS, l'enum UploadState de IN_PROGRESS.
for (let i = 0; state === "IN_PROGRESS" || state === "UPLOAD_IN_PROGRESS"; i++) {
  if (i === 24) throw new Error("Le Store n'a pas fini de traiter l'envoi après deux minutes.");
  await new Promise((resolve) => setTimeout(resolve, 5000));
  state = (await call(`${API}/v2/${item}:fetchStatus`)).lastAsyncUploadState;
}
if (state !== "SUCCEEDED") throw new Error(`Envoi refusé par le Store (${state}) : ${JSON.stringify(upload)}`);
console.log("Zip envoyé au Chrome Web Store.");

const publish = await call(`${API}/v2/${item}:publish`, { method: "POST" });
console.log(`Soumis à la validation de Google : ${JSON.stringify(publish.state ?? publish)}`);
