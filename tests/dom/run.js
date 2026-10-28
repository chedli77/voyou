/**
 * Charge l'extension dans un Chromium headless et la teste sur de fausses pages
 * X servies localement :
 *   1. chaque tweet est masqué ou non comme prévu (champ hide des mocks) ;
 *   2. le compteur est juste et « Afficher quand même » révèle sans ouvrir le tweet ;
 *   3. (legacy) les réglages de la popup s'appliquent : filtre vulgarité, compte autorisé.
 *
 * Usage : node tests/dom/run.js legacy   (ancien DOM de X, avec data-testid)
 *         node tests/dom/run.js xweb     (nouveau client, sans data-testid)
 * Première fois : npx playwright install chromium
 */
import { createHash } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium } from "playwright";
import * as legacy from "./mock-legacy.js";
import * as xweb from "./mock-xweb.js";

/** @typedef {import("./mock-legacy.js").Tweet} Tweet */

const mode = process.argv[2] === "xweb" ? "xweb" : "legacy";
const mock = mode === "xweb" ? xweb : legacy;
const extension = resolve("extension");
// Chrome dérive l'id d'une extension non empaquetée de son chemin : sha256, puis 0-f devient a-p.
const extensionId = createHash("sha256")
  .update(extension)
  .digest("hex")
  .slice(0, 32)
  .replace(/./g, (c) => String.fromCharCode(97 + parseInt(c, 16)));

const context = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "voyou-")), {
  headless: true,
  channel: "chromium",
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
});
await context.route("https://x.com/**", (route) =>
  route.fulfill({
    contentType: "text/html",
    body: route.request().url().includes("/status/")
      ? mock.page(mock.thread, "thread")
      : mock.page(mock.timeline, "home"),
  }),
);

let failures = 0;
/** @param {string} message */
const fail = (message) => {
  failures++;
  console.log(`  ÉCHEC  ${message}`);
};

/**
 * @param {string} title
 * @param {string} url
 * @param {Tweet[]} tweets
 * @param {(tweet: Tweet) => boolean} expectHidden
 */
async function checkPage(title, url, tweets, expectHidden) {
  const page = await context.newPage();
  page.on("pageerror", (error) => fail(`erreur de page : ${error.message}`));
  await page.goto(url);
  await page.waitForTimeout(2500);

  const states = await page.$$eval("article", (articles) =>
    articles.map((a) => a.getAttribute("data-voyou-state") === "hidden"),
  );
  console.log(`${mode}/${title}`);
  tweets.forEach((tweet, i) => {
    const ok = states[i] === expectHidden(tweet);
    if (!ok) failures++;
    console.log(`  ${ok ? "ok    " : "ÉCHEC "} ${states[i] ? "masqué " : "visible"}  @${tweet.h} : ${tweet.text}`);
  });

  const hidden = tweets.filter(expectHidden).length;
  const hud = await page.textContent(".voyou-hud__count");
  if (hud !== `${hidden} masqué${hidden > 1 ? "s" : ""}`) fail(`compteur : "${hud}", attendu ${hidden}`);
  return page;
}

for (const [title, url, tweets] of /** @type {[string, string, Tweet[]][]} */ ([
  ["timeline", "https://x.com/home", mock.timeline],
  ["thread", "https://x.com/moncompte/status/4000", mock.thread],
])) {
  const page = await checkPage(title, url, tweets, (t) => t.hide);
  // Le premier tweet masqué doit se révéler au clic, sans ouvrir le tweet.
  const key = await page.locator('article[data-voyou-state="hidden"]').first().getAttribute("data-voyou-key");
  const first = page.locator(`article[data-voyou-key="${key}"]`);
  if (!(await first.locator(".voyou-reason").textContent())) fail("aucune raison affichée sous le bouton");
  await first.getByRole("button", { name: "Afficher quand même" }).click();
  if ((await first.getAttribute("data-voyou-state")) !== "revealed" || page.url() !== url) {
    fail("« Afficher quand même » ne révèle pas le tweet");
  }
  await page.screenshot({ path: join("tests/dom/out", `${mode}-${title}.png`), fullPage: true });
  await page.close();
}

if (mode === "legacy") {
  const allowedHandle = mock.thread.find((t) => t.hide)?.h ?? "";
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup/popup.html`);
  await popup.getByText("Vulgarité").click();
  await popup.locator("#allowed").fill(`@${allowedHandle}`);
  await popup.waitForTimeout(800);
  await popup.screenshot({ path: join("tests/dom/out", "popup.png") });
  await popup.close();
  const page = await checkPage(
    "réglages (vulgarité + compte autorisé)",
    "https://x.com/moncompte/status/4000",
    mock.thread,
    (t) => (t.h === allowedHandle ? false : t.hide || t.profanity === true),
  );
  await page.close();
}
await context.close();

console.log(failures ? `${failures} échec(s)` : `Tests DOM ${mode} : tout est OK`);
process.exitCode = failures ? 1 : 0;
