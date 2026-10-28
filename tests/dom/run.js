/**
 * Charge l'extension dans un Chromium headless et la teste sur de fausses pages
 * X servies localement. Vérifie pour chaque tweet qu'il est masqué ou non comme
 * prévu (champ hide des mocks), puis qu'« Afficher quand même » le révèle.
 *
 * Usage : node tests/dom/run.js legacy   (ancien DOM de X, avec data-testid)
 *         node tests/dom/run.js xweb     (nouveau client, sans data-testid)
 * Première fois : npx playwright install chromium
 */
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium } from "playwright";
import * as legacy from "./mock-legacy.js";
import * as xweb from "./mock-xweb.js";

const mode = process.argv[2] === "xweb" ? "xweb" : "legacy";
const mock = mode === "xweb" ? xweb : legacy;
const extension = resolve("extension");

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
/** @type {[string, string, import("./mock-legacy.js").Tweet[]][]} */
const pages = [
  ["timeline", "https://x.com/home", mock.timeline],
  ["thread", "https://x.com/moncompte/status/4000", mock.thread],
];
for (const [name, url, tweets] of pages) {
  const page = await context.newPage();
  page.on("pageerror", (error) => {
    failures++;
    console.log(`  erreur de page : ${error.message}`);
  });
  await page.goto(url);
  await page.waitForTimeout(2500);

  const states = await page.$$eval("article", (articles) =>
    articles.map((a) => a.getAttribute("data-voyou-state") === "hidden"),
  );
  console.log(`${mode}/${name}`);
  tweets.forEach((tweet, i) => {
    const ok = states[i] === tweet.hide;
    if (!ok) failures++;
    console.log(`  ${ok ? "ok    " : "ÉCHEC "} ${states[i] ? "masqué " : "visible"}  @${tweet.h} : ${tweet.text}`);
  });

  const hidden = tweets.filter((t) => t.hide).length;
  const hud = await page.textContent(".voyou-hud__count");
  if (hud !== `${hidden} masqué${hidden > 1 ? "s" : ""}`) {
    failures++;
    console.log(`  ÉCHEC  compteur : "${hud}", attendu ${hidden}`);
  }

  // Le premier tweet masqué doit se révéler au clic, sans ouvrir le tweet.
  const key = await page.locator('article[data-voyou-state="hidden"]').first().getAttribute("data-voyou-key");
  const first = page.locator(`article[data-voyou-key="${key}"]`);
  await first.getByRole("button", { name: "Afficher quand même" }).click();
  if ((await first.getAttribute("data-voyou-state")) !== "revealed" || page.url() !== url) {
    failures++;
    console.log("  ÉCHEC  « Afficher quand même » ne révèle pas le tweet");
  }
  await page.screenshot({ path: join("tests/dom/out", `${mode}-${name}.png`), fullPage: true });
  await page.close();
}
await context.close();

console.log(failures ? `${failures} échec(s)` : `Tests DOM ${mode} : tout est OK`);
process.exitCode = failures ? 1 : 0;
