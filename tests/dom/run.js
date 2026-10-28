/**
 * Charge l'extension dans un Chromium headless et la teste sur de fausses pages
 * X servies localement :
 *   1. chaque tweet est masqué ou non comme prévu (champ hide des mocks), le
 *      compteur est juste, « Afficher quand même » révèle sans ouvrir le tweet ;
 *   2. (legacy) tweet cité, nom d'affichage, bio et cartes de compte, thème sombre ;
 *   3. (legacy) réglages de la popup, « Ce n'est pas de la haine », « Autoriser »,
 *      statistiques.
 *
 * Usage : node tests/dom/run.js legacy   (ancien DOM de X, avec data-testid)
 *         node tests/dom/run.js xweb     (nouveau client, sans data-testid)
 * Première fois : npx playwright install chromium
 */
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium } from "playwright";
import * as legacy from "./mock-legacy.js";
import * as xweb from "./mock-xweb.js";

/** @typedef {import("./mock-legacy.js").Tweet} Tweet */
/** @typedef {import("playwright").Page} Page */

const mode = process.argv[2] === "xweb" ? "xweb" : "legacy";
const mock = mode === "xweb" ? xweb : legacy;
const extension = resolve("extension");
const OUT = "tests/dom/out";
mkdirSync(OUT, { recursive: true });
// Chrome dérive l'id d'une extension non empaquetée de son chemin : sha256, puis 0-f devient a-p.
const extensionId = createHash("sha256")
  .update(extension)
  .digest("hex")
  .slice(0, 32)
  .replace(/./g, (c) => String.fromCharCode(97 + parseInt(c, 16)));
const POPUP = `chrome-extension://${extensionId}/popup/popup.html`;
const THREAD = "https://x.com/moncompte/status/4000";

const context = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "voyou-")), {
  headless: true,
  channel: "chromium",
  locale: "fr-FR",
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`, "--lang=fr"],
});
await context.route("https://x.com/**", (route) => {
  const url = route.request().url();
  let body;
  if (mode === "legacy" && url.includes(`/${legacy.profile.h}`)) body = legacy.profilePage(legacy.profile);
  else if (url.includes("/status/")) body = mock.page(mock.thread, "thread");
  else body = mock.page(mock.timeline, "home", url.includes("dark"));
  return route.fulfill({ contentType: "text/html", body });
});

let failures = 0;
/** @param {string} message */
const fail = (message) => {
  failures++;
  console.log(`  ÉCHEC  ${message}`);
};
/**
 * @param {boolean} ok
 * @param {string} message
 */
const check = (ok, message) => {
  if (!ok) failures++;
  console.log(`  ${ok ? "ok    " : "ÉCHEC "} ${message}`);
};

/** @param {string} url */
async function open(url) {
  const page = await context.newPage();
  page.on("pageerror", (error) => fail(`erreur de page : ${error.message}`));
  await page.goto(url);
  await page.waitForTimeout(2500);
  return page;
}

/** @param {import("playwright").Locator} el */
const isHidden = async (el) => (await el.getAttribute("data-voyou-state")) === "hidden";

/**
 * @param {string} title
 * @param {string} url
 * @param {Tweet[]} tweets
 * @param {(tweet: Tweet) => boolean} expectHidden
 */
async function checkTweets(title, url, tweets, expectHidden) {
  const page = await open(url);
  console.log(`${mode}/${title}`);
  const articles = page.locator("article");
  for (const [i, tweet] of tweets.entries()) {
    const article = articles.nth(i);
    const hidden = await isHidden(article);
    check(hidden === expectHidden(tweet), `${hidden ? "masqué " : "visible"}  @${tweet.h} : ${tweet.text}`);
    if (tweet.quote) {
      const quoteHidden = await isHidden(article.locator('div[role="link"]').first());
      check(
        quoteHidden === tweet.quote.hide,
        `${quoteHidden ? "masqué " : "visible"}  tweet cité : ${tweet.quote.text}`,
      );
    }
  }
  const hidden = tweets.filter(expectHidden).length + tweets.filter((t) => t.quote?.hide && !expectHidden(t)).length;
  const hud = await page.textContent(".voyou-hud__count");
  check(hud === `${hidden} masqué${hidden > 1 ? "s" : ""}`, `compteur : « ${hud} »`);
  return page;
}

/** @param {Page} page */
async function revealFirst(page) {
  const key = await page.locator('[data-voyou-state="hidden"]').first().getAttribute("data-voyou-key");
  const el = page.locator(`[data-voyou-key="${key}"]`);
  await el.locator(':scope > .voyou-overlay [data-voyou-action="reveal"]').click();
  return el;
}

for (const [title, url, tweets] of /** @type {[string, string, Tweet[]][]} */ ([
  ["timeline", "https://x.com/home", mock.timeline],
  ["thread", THREAD, mock.thread],
])) {
  const page = await checkTweets(title, url, tweets, (t) => t.hide);
  const first = page.locator("article[data-voyou-state]").first();
  check((await first.locator(".voyou-reason").textContent()) !== "", "motif affiché sous le bouton");
  check(
    (await first.locator('[data-voyou-action="reveal"]').textContent()) === "Afficher quand même",
    "interface en français",
  );
  const revealed = await revealFirst(page);
  check(
    (await revealed.getAttribute("data-voyou-state")) === "revealed" && page.url() === url,
    "« Afficher quand même » révèle sans ouvrir le tweet",
  );
  await page.screenshot({ path: join(OUT, `${mode}-${title}.png`), fullPage: true });
  await page.close();
}

if (mode === "legacy") {
  console.log("legacy/profil");
  const profile = await open(`https://x.com/${legacy.profile.h}`);
  check(
    (await isHidden(profile.locator('[data-testid="UserDescription"]'))) === legacy.profile.hideBio,
    "bio haineuse masquée",
  );
  check(!(await isHidden(profile.locator('[data-testid="UserName"]'))), "nom de profil normal visible");
  for (const cell of legacy.profile.cells) {
    const hidden = await isHidden(profile.locator('[data-testid="UserCell"]').filter({ hasText: `@${cell.h}` }));
    check(hidden === cell.hide, `${hidden ? "masqué " : "visible"}  carte @${cell.h} : ${cell.bio}`);
  }
  await profile.screenshot({ path: join(OUT, "legacy-profile.png"), fullPage: true });
  await profile.close();

  console.log("legacy/thème sombre");
  const dark = await open("https://x.com/home?dark");
  check((await dark.getAttribute("html", "data-voyou-theme")) === "dark", "thème sombre reconnu");
  await dark.screenshot({ path: join(OUT, "legacy-dark.png"), fullPage: true });
  await dark.close();

  const allowedHandle = mock.thread.find((t) => t.hide)?.h ?? "";
  const popup = await context.newPage();
  await popup.goto(POPUP);
  await popup.getByText("Vulgarité").click();
  await popup.locator("#allowed").fill(`@${allowedHandle}`);
  await popup.waitForTimeout(800);
  await popup.screenshot({ path: join(OUT, "popup.png"), fullPage: true });
  await popup.close();
  const settingsPage = await checkTweets("réglages (vulgarité + compte autorisé)", THREAD, mock.thread, (t) =>
    t.h === allowedHandle ? false : t.hide || t.profanity === true,
  );

  console.log("legacy/actions");
  const notHate = await revealFirst(settingsPage);
  await notHate.locator('[data-voyou-action="not-hate"]').click();
  await settingsPage.waitForTimeout(300);
  const allow = await revealFirst(settingsPage);
  const allowLabel = (await allow.locator('[data-voyou-action="allow"]').textContent()) ?? "";
  await allow.locator('[data-voyou-action="allow"]').click();
  await settingsPage.waitForTimeout(2500);
  await settingsPage.close();

  const after = await context.newPage();
  await after.goto(POPUP);
  await after.waitForTimeout(500);
  check((await after.locator("#muted-list li").count()) > 0, "« Ce n'est pas de la haine » ajoute des règles ignorées");
  const allowed = await after.locator("#allowed").inputValue();
  check(
    allowed.includes(allowLabel.replace(/^Autoriser /, "")),
    `« ${allowLabel} » ajoute le compte aux comptes autorisés`,
  );
  const total = (await after.locator("#stats-total").textContent()) ?? "";
  check(/^\d+ messages? masqués?$/.test(total), `statistiques : « ${total} »`);
  await after.screenshot({ path: join(OUT, "popup-after.png"), fullPage: true });
  await after.close();
}
await context.close();

console.log(failures ? `${failures} échec(s)` : `Tests DOM ${mode} : tout est OK`);
process.exitCode = failures ? 1 : 0;
