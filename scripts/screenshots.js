/**
 * Captures des fiches des boutiques, prises sur l'extension chargée dans
 * Chromium et une page X factice des tests DOM :
 *   dist/screenshots/01-masque.png    posts masqués, motif sous le bouton, compteur
 *   dist/screenshots/02-panneau.png   module flottant agrandi en panneau de réglages
 *   dist/screenshots/03-revele.png    post révélé et sa barre d'actions
 *
 * Images de 1280 × 800, le format qu'acceptent le Chrome Web Store, Edge et
 * Firefox. Comptes et textes inventés ; les posts haineux restent voilés, et
 * le post révélé n'est masqué que par un mot choisi.
 *
 * Usage : npm run screenshots
 * Première fois : npx playwright install chromium
 */
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium } from "playwright";
import { page as mockPage } from "../tests/dom/mock-legacy.js";

/** @typedef {import("../tests/dom/mock-legacy.js").Tweet} Tweet */

const OUT = "dist/screenshots";
// 1024 × 640 à l'échelle 1,25 : 1280 × 800 pixels, et une interface lisible en vignette.
const VIEWPORT = { width: 1024, height: 640 };
const SCALE = 1.25;
const CUSTOM_TERM = "spoiler";

/** @type {Tweet[]} */
const TWEETS = [
  { id: 1, h: "user101", name: "Camille", text: "Le marché revient place de la Mairie dimanche.", n: 4, hide: false },
  { id: 2, h: "user202", name: "Noa", text: "Rentre dans ton pays, personne ne veut de toi ici.", n: 0, hide: true },
  { id: 3, h: "user303", name: "Alex", text: "Une bonne recette de pain sans pétrissage ?", n: 7, hide: false },
  { id: 4, h: "user404", name: "Sam", text: "Spoiler : le dernier épisode finit bien, promis.", n: 2, hide: true },
  { id: 5, h: "user505", name: "Lou", text: "Je sais où tu habites, je vais te tuer.", n: 0, hide: true },
  { id: 6, h: "user606", name: "Eden", text: "Il pleut sur Lyon, parfait pour finir mon livre.", n: 1, hide: false },
];
// Le seul post révélé : il n'est masqué que par le mot choisi.
const SPOILER = TWEETS.findIndex((tweet) => tweet.text.toLowerCase().includes(CUSTOM_TERM));

// Habillage sobre de la page factice : une colonne de posts et des avatars en aplat, sans logo ni nom de X.
// La rangée des boutons garde sa hauteur sans rien montrer : sous 72 px, Voyou réduit le voile au bouton.
const STYLE = `
body { margin: 0; background: #fff; color: #0f1419; font: 15px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
header[role="banner"] { display: none; }
a { color: inherit; text-decoration: none; }
[data-testid="primaryColumn"] { box-sizing: border-box; width: 600px; min-height: 100vh; margin: 0 auto; border-inline: 1px solid #eff3f4; }
[data-testid="cellInnerDiv"] { border-bottom: 1px solid #eff3f4; }
article > :first-child { padding: 12px 16px; }
div:has(> [data-testid="Tweet-User-Avatar"]) { display: flex; gap: 12px; }
[data-testid="Tweet-User-Avatar"] { flex: none; width: 40px; height: 40px; border-radius: 50%; background: var(--avatar); }
[data-testid="Tweet-User-Avatar"] img { display: none; }
[data-testid="Tweet-User-Avatar"] + div { flex: 1; }
[data-testid="User-Name"], [data-testid="User-Name"] > div { display: flex; gap: 4px; }
[data-testid="User-Name"] > div:first-child { font-weight: 700; }
[data-testid="User-Name"] > div:last-child { color: #536471; }
[role="group"] { height: 20px; margin-top: 8px; visibility: hidden; }
[data-testid="cellInnerDiv"]:nth-child(6n + 1) { --avatar: #e9a46a; }
[data-testid="cellInnerDiv"]:nth-child(6n + 2) { --avatar: #7fb6d6; }
[data-testid="cellInnerDiv"]:nth-child(6n + 3) { --avatar: #9ccc8e; }
[data-testid="cellInnerDiv"]:nth-child(6n + 4) { --avatar: #c3a6e0; }
[data-testid="cellInnerDiv"]:nth-child(6n + 5) { --avatar: #e8a1b0; }
[data-testid="cellInnerDiv"]:nth-child(6n + 6) { --avatar: #d6c27a; }
`;

const extension = resolve("extension");
// Chrome dérive l'id d'une extension non empaquetée de son chemin : sha256, puis 0-f devient a-p.
const extensionId = createHash("sha256")
  .update(extension)
  .digest("hex")
  .slice(0, 32)
  .replace(/./g, (c) => String.fromCharCode(97 + parseInt(c, 16)));

mkdirSync(OUT, { recursive: true });
const context = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "voyou-")), {
  headless: true,
  channel: "chromium",
  locale: "fr-FR",
  viewport: VIEWPORT,
  deviceScaleFactor: SCALE,
  // Sans animation, le panneau est capturé ouvert et non en train de s'ouvrir.
  reducedMotion: "reduce",
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
});
await context.route("https://x.com/**", (route) =>
  route.fulfill({
    contentType: "text/html",
    body: mockPage(TWEETS, "Accueil").replace("</head>", `<style>${STYLE}</style></head>`),
  }),
);

// Le mot choisi s'ajoute dans la popup, comme le ferait l'utilisateur. Il est enregistré 400 ms après la frappe.
const popup = await context.newPage();
await popup.goto(`chrome-extension://${extensionId}/popup/popup.html`);
await popup.locator('[data-field="custom"]').fill(CUSTOM_TERM);
await popup.waitForTimeout(800);
await popup.close();

const page = await context.newPage();
await page.goto("https://x.com/home");
// Les posts arrivent après le chargement, comme sur X, et sont notés dès leur arrivée. Les
// statistiques affichées dans le panneau sont écrites deux secondes après le dernier masquage.
const articles = page.locator("article");
await articles.nth(TWEETS.length - 1).waitFor();
await page.waitForTimeout(2500);
for (const [i, tweet] of TWEETS.entries()) {
  const hidden = (await articles.nth(i).getAttribute("data-voyou-state")) === "hidden";
  if (hidden !== tweet.hide) {
    throw new Error(`@${tweet.h} devrait être ${tweet.hide ? "masqué" : "visible"} : « ${tweet.text} »`);
  }
}

/** @param {string} name */
async function shoot(name) {
  // Pointeur hors de l'interface : aucun bouton ne reste en survol.
  await page.mouse.move(0, 0);
  const path = join(OUT, name);
  await page.screenshot({ path });
  console.log(`Prête : ${path}`);
}

await shoot("01-masque.png");

await page.click("#voyou-hud");
await shoot("02-panneau.png");

// Un clic à côté réduit le panneau.
await page.mouse.click(VIEWPORT.width / 8, VIEWPORT.height / 2);
await articles.nth(SPOILER).locator('[data-voyou-action="reveal"]').click();
await shoot("03-revele.png");

await context.close();
