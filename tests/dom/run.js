/**
 * Charge l'extension dans un Chromium headless et la teste sur de fausses pages
 * X servies localement :
 *   1. chaque tweet est masqué ou non comme prévu (champ hide des mocks), et un
 *      tweet masqué est vraiment flouté sous son voile, hors de portée des
 *      lecteurs d'écran et du clavier ; le compteur est juste ; ni « Afficher
 *      quand même » ni un clic sur le voile ou la barre n'ouvrent le tweet ;
 *   2. ce que X ajoute ou réécrit après coup, où que ce soit dans la page, est
 *      masqué avant la prochaine image ; au repos, la page ne bouge plus ; sans
 *      content.css, aucun bouton de Voyou ne reste affiché ;
 *   3. (legacy) tweet cité, nom d'affichage, bio et cartes de compte, langue de
 *      X suivie sans image en clair, thème sombre ;
 *   4. (legacy) réglages de la popup et du module (saisie qui n'arrive pas à
 *      la page, clavier, panneaux qui se suivent, accès à x.com), « Ce n'est
 *      pas de la haine », « Autoriser » (pas par un clic fabriqué),
 *      statistiques ; un compte autorisé ne refait pas les autres voiles ;
 *      compteur de la page ;
 *   5. (legacy) cycle de vie : reprise de ce qu'une instance tuée a laissé
 *      (Firefox), onglet coupé de l'extension par un rechargement (Chrome).
 *
 * Usage : node tests/dom/run.js legacy   (ancien DOM de X, avec data-testid)
 *         node tests/dom/run.js xweb     (nouveau client, sans data-testid)
 * Première fois : npx playwright install chromium
 */
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import * as legacy from "./mock-legacy.js";
import * as xweb from "./mock-xweb.js";

/** @typedef {import("./mock-legacy.js").Tweet} Tweet */
/** @typedef {import("playwright").Page} Page */
/** @typedef {import("playwright").Locator} Locator */

const mode = process.argv[2] === "xweb" ? "xweb" : "legacy";
const mock = mode === "xweb" ? xweb : legacy;
// Chrome dérive l'id d'une extension non empaquetée de son chemin réel, liens
// symboliques résolus : sha256, puis 0-f devient a-p. Sous Windows, il hache
// ce chemin en UTF-16 : ce calcul n'y vaut pas.
const extension = realpathSync("extension");
const OUT = "tests/dom/out";
mkdirSync(OUT, { recursive: true });
const extensionId = createHash("sha256")
  .update(extension)
  .digest("hex")
  .slice(0, 32)
  .replace(/./g, (c) => String.fromCharCode(97 + parseInt(c, 16)));
const POPUP = `chrome-extension://${extensionId}/popup/popup.html`;
const THREAD = "https://x.com/moncompte/status/4000";

const profileDir = mkdtempSync(join(tmpdir(), "voyou-"));
const context = await chromium.launchPersistentContext(profileDir, {
  headless: true,
  channel: "chromium",
  locale: "fr-FR",
  // La langue de Chromium est fixée pour que le test ne dépende pas de la
  // machine : sous Linux, il la prend dans l'environnement, pas dans --lang.
  // L'interface de Voyou, elle, suit la langue des pages factices.
  env: { ...process.env, LANGUAGE: "fr", LANG: "fr_FR.UTF-8", LC_ALL: "fr_FR.UTF-8" },
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`, "--lang=fr"],
});
await context.route("https://x.com/**", (route) => {
  const url = route.request().url();
  let body;
  if (mode === "legacy" && url.includes(`/${legacy.profile.h}`)) body = legacy.profilePage(legacy.profile);
  else if (url.includes("/status/")) body = mock.page(mock.thread, "thread");
  else if (mode === "legacy")
    body = legacy.page(legacy.timeline, "home", {
      dark: url.includes("dark"),
      lang: url.includes("lang=en") ? "en" : "fr",
      stale: url.includes("reprise") ? legacy.leftovers : "",
    });
  else body = mock.page(mock.timeline, "home");
  return route.fulfill({ contentType: "text/html", body });
});

// L'interface suit la langue de X : les pages factices sont en français
// (lang="fr"), les textes attendus viennent donc de _locales/fr.
/**
 * @param {string} locale
 * @returns {Record<string, { message: string }>}
 */
const readMessages = (locale) => JSON.parse(readFileSync(join(extension, "_locales", locale, "messages.json"), "utf8"));
const locale = "fr";
const messages = readMessages(locale);
/**
 * @param {string} key
 * @param {string | number} [value] valeur de l'unique paramètre ($COUNT$, $HANDLE$)
 */
const msg = (key, value = "") => messages[key].message.replace(/\$[A-Z]+\$/, String(value));
/** @param {number} n */
const hudLabel = (n) => msg(n > 1 ? "hudCountMany" : "hudCountOne", n);
console.log(`interface testée en « ${locale} »`);

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

/**
 * Masqué veut dire illisible : l'attribut d'état, le flou des enfants, le
 * voile et inert (ni lecteur d'écran ni Tab) doivent dire la même chose,
 * sinon le test échoue.
 * @param {Locator} el
 */
async function isHidden(el) {
  const { state, blurred, veiled, inert } = await el.evaluate((e) => {
    const targets = [...e.children].filter((c) => c.hasAttribute("data-voyou-target"));
    const overlay = e.querySelector(":scope > .voyou-overlay");
    const inert = targets.filter((c) => c instanceof HTMLElement && c.inert).length;
    return {
      state: e.getAttribute("data-voyou-state"),
      blurred: targets.length > 0 && targets.every((c) => getComputedStyle(c).filter.includes("blur(")),
      veiled: !!overlay && getComputedStyle(overlay).display !== "none",
      inert: inert === 0 ? false : inert === targets.length ? true : null,
    };
  });
  const hidden = state === "hidden";
  if (blurred !== hidden || veiled !== hidden || inert !== hidden) {
    fail(`état « ${state} », mais flou : ${blurred}, voile : ${veiled}, inert : ${inert}`);
  }
  return hidden;
}

/**
 * Lit le repère des pages factices (data-opened) qui remplace la navigation
 * de X, puis l'efface.
 * @param {Page} page
 */
const takeOpened = (page) =>
  page.evaluate(() => {
    const opened = document.documentElement.dataset.opened ?? null;
    delete document.documentElement.dataset.opened;
    return opened;
  });

/**
 * Noms et textes que lisent les lecteurs d'écran : l'arbre d'accessibilité
 * de Chromium, sans les nœuds ignorés.
 * @param {Page} page
 */
async function accessibleNames(page) {
  const cdp = await context.newCDPSession(page);
  const { nodes } = await cdp.send("Accessibility.getFullAXTree");
  await cdp.detach();
  return nodes.filter((node) => !node.ignored).map((node) => String(node.name?.value ?? ""));
}

/**
 * @typedef {{ nodeId: number, attributes?: string[], children?: DomNode[], shadowRoots?: DomNode[] }} DomNode
 */

/**
 * Boîtes des éléments d'une classe, Shadow DOM fermé du module compris :
 * aucun sélecteur ne le traverse, CDP si.
 * @param {Page} page
 * @param {string} className
 * @returns {Promise<{ left: number, top: number, right: number, bottom: number }[]>}
 */
async function shadowBoxes(page, className) {
  const cdp = await context.newCDPSession(page);
  const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
  /** @type {number[]} */
  const ids = [];
  /** @param {DomNode} node */
  const walk = (node) => {
    const attrs = node.attributes ?? [];
    for (let i = 0; i < attrs.length; i += 2) {
      if (attrs[i] === "class" && attrs[i + 1].split(/\s+/).includes(className)) ids.push(node.nodeId);
    }
    for (const child of [...(node.children ?? []), ...(node.shadowRoots ?? [])]) walk(child);
  };
  walk(root);
  const boxes = [];
  for (const nodeId of ids) {
    const { model } = await cdp.send("DOM.getBoxModel", { nodeId }).catch(() => ({ model: null }));
    const xs = model ? model.border.filter((_, i) => i % 2 === 0) : [0];
    const ys = model ? model.border.filter((_, i) => i % 2 === 1) : [0];
    boxes.push({ left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) });
  }
  await cdp.detach();
  return boxes;
}

/**
 * Éléments masqués attendus : les tweets, plus les tweets cités masqués seuls.
 * @param {Tweet[]} tweets
 * @param {(tweet: Tweet) => boolean} expectHidden
 */
const expectedCount = (tweets, expectHidden) =>
  tweets.filter(expectHidden).length + tweets.filter((t) => t.quote?.hide && !expectHidden(t)).length;

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
  // Ni le texte d'un élément masqué ni le nom que X donne à son article
  // (aria-labelledby) n'arrivent aux lecteurs d'écran ; celui d'un tweet visible, si.
  const names = await accessibleNames(page);
  const hiddenTexts = tweets.flatMap((t) => [
    ...(expectHidden(t) ? [t.text] : []),
    ...(t.quote && (t.quote.hide || expectHidden(t)) ? [t.quote.text] : []),
  ]);
  const exposed = hiddenTexts.filter((text) => names.some((name) => name.includes(text)));
  const visible = tweets.find((t) => !expectHidden(t));
  check(
    exposed.length === 0 && !!visible && names.some((name) => name.includes(visible.text)),
    `lecteurs d'écran : aucun texte masqué dans l'arbre d'accessibilité${exposed.length ? ` (${exposed.join(" | ")})` : ""}`,
  );
  const hidden = expectedCount(tweets, expectHidden);
  // Le module vit dans un Shadow DOM fermé : il expose son compte en attribut.
  const hud = await page.getAttribute("#voyou-hud", "data-count");
  check(hud === String(hidden), `compteur : ${hud} (${hudLabel(hidden)})`);
  return page;
}

/** @param {Page} page */
async function revealFirst(page) {
  const key = await page.locator('[data-voyou-state="hidden"]').first().getAttribute("data-voyou-key");
  const el = page.locator(`[data-voyou-key="${key}"]`);
  await el.locator(':scope > .voyou-overlay [data-voyou-action="reveal"]').click();
  return el;
}

/**
 * Modifie la page comme le ferait X, puis lit l'état de l'élément visé dès que
 * les observateurs sont passés, avant toute autre tâche : seul le traitement
 * immédiat des mutations peut l'avoir masqué, pas la passe de sécurité.
 * @param {Page} page
 * @param {"insert" | "append" | "rewrite"} how ajouter du HTML ou un texte, réécrire un texte
 * @param {string} where élément modifié
 * @param {string} what HTML ou texte
 * @param {string} target élément dont on lit l'état
 */
const changeThenRead = (page, how, where, what, target) =>
  page.evaluate(
    async ([how, where, what, target]) => {
      const el = document.querySelector(where);
      if (how === "insert") el?.insertAdjacentHTML("beforeend", what);
      else if (how === "append") el?.append(what);
      else if (el?.firstChild) el.firstChild.nodeValue = what;
      await Promise.resolve();
      return document.querySelector(target)?.getAttribute("data-voyou-state") ?? null;
    },
    [how, where, what, target],
  );

/**
 * Compte ce qui change dans la page pendant ms millisecondes : nœuds ajoutés
 * ou retirés, textes, valeurs d'attributs. Réécrire la même valeur ne compte pas.
 * @param {Page} page
 * @param {number} ms
 */
const changesDuring = (page, ms) =>
  page.evaluate(
    (ms) =>
      new Promise((done) => {
        let changes = 0;
        const observer = new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (m.type !== "attributes") changes++;
            else if (/** @type {Element} */ (m.target).getAttribute(m.attributeName ?? "") !== m.oldValue) changes++;
          }
        });
        observer.observe(document, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeOldValue: true,
        });
        setTimeout(() => {
          observer.disconnect();
          done(changes);
        }, ms);
      }),
    ms,
  );

for (const [title, url, tweets] of /** @type {[string, string, Tweet[]][]} */ ([
  ["timeline", "https://x.com/home", mock.timeline],
  ["thread", THREAD, mock.thread],
])) {
  const page = await checkTweets(title, url, tweets, (t) => t.hide);
  const first = page.locator("article[data-voyou-state]").first();
  check((await first.locator(".voyou-reason").textContent()) !== "", "motif affiché sous le bouton");
  check((await first.locator('[data-voyou-action="reveal"]').textContent()) === msg("reveal"), "interface traduite");
  // Les pages factices ouvrent le post cliqué, comme X : le voile, hors du
  // bouton, et la barre sont à Voyou, aucun clic n'y passe jusqu'à X.
  const veil = page.locator('[data-voyou-state="hidden"] > .voyou-overlay').first();
  await veil.scrollIntoViewIfNeeded();
  const veilBox = await veil.boundingBox();
  await page.mouse.click((veilBox?.x ?? 0) + 4, (veilBox?.y ?? 0) + 4);
  await page.mouse.click((veilBox?.x ?? 0) + 4, (veilBox?.y ?? 0) + 4, { button: "middle" });
  check(
    !!veilBox && (await takeOpened(page)) === null && (await veil.isVisible()),
    "un clic sur le voile, hors du bouton, n'ouvre pas le post",
  );
  const revealed = await revealFirst(page);
  check(
    (await revealed.getAttribute("data-voyou-state")) === "revealed" && (await takeOpened(page)) === null,
    "« Afficher quand même » révèle sans ouvrir le tweet",
  );
  const barBox = await revealed.locator(":scope > .voyou-rehide").boundingBox();
  await page.mouse.click((barBox?.x ?? 0) + 4, (barBox?.y ?? 0) + 4);
  check(!!barBox && (await takeOpened(page)) === null, "un clic sur le fond de la barre n'ouvre pas le post");
  await page.locator("article:not([data-voyou-state])").first().locator('div[dir="auto"]').first().click();
  check((await takeOpened(page)) === "click", "témoin : un clic dans un post visible l'ouvre");
  // Au clavier, le bouton disparaît avec le voile : le focus doit rester dans
  // le post révélé, pas retomber sur la page (le navigateur l'y renvoie au
  // rendu suivant, qu'on attend).
  const nextKey = await page.locator('[data-voyou-state="hidden"]').first().getAttribute("data-voyou-key");
  const byKeyboard = page.locator(`[data-voyou-key="${nextKey}"]`);
  await byKeyboard.locator(':scope > .voyou-overlay [data-voyou-action="reveal"]').focus();
  await page.keyboard.press("Enter");
  const focusKept = await byKeyboard.evaluate(async (el) => {
    for (let i = 0; i < 2; i++) await new Promise((done) => requestAnimationFrame(done));
    return el.getAttribute("data-voyou-state") === "revealed" && el.contains(document.activeElement);
  });
  check(
    focusKept && (await takeOpened(page)) === null,
    "révélé au clavier : le focus reste dans le post, rien ne s'ouvre",
  );
  await page.screenshot({ path: join(OUT, `${mode}-${title}.png`), fullPage: true });
  await page.close();
}

// Ce qui arrive après le premier rendu : X rend parfois le texte après le
// reste du tweet, réécrit des textes en place, et affiche des tweets et des
// cartes hors de la colonne principale.
console.log(`${mode}/contenus ajoutés après coup`);
const late = await open("https://x.com/home");
await late.evaluate(
  (html) => document.getElementById("tl")?.insertAdjacentHTML("beforeend", `<div id="t5001">${html}</div>`),
  mock.tweetHTML({ id: 5001, h: "user901", name: "U901", text: "", n: 0, hide: true }),
);
await late.waitForTimeout(100);
const skeletonState = await late.locator("#t5001 article").getAttribute("data-voyou-state");
const lateText = await changeThenRead(
  late,
  "append",
  '#t5001 div[dir="auto"] > span',
  "sale bougnoule, dégage",
  "#t5001 article",
);
check(
  skeletonState === null && lateText === "hidden" && (await isHidden(late.locator("#t5001 article"))),
  "texte rendu après le reste du tweet : masqué tout de suite",
);
const clean = mock.timeline.find((t) => !t.hide);
const cleanArticle = `article:has(a[href="/${clean?.h}/status/${clean?.id}"])`;
const rewritten = await changeThenRead(
  late,
  "rewrite",
  `${cleanArticle} div[dir="auto"] > span`,
  "rentre dans ton pays sale arabe",
  cleanArticle,
);
check(
  rewritten === "hidden" && (await isHidden(late.locator(cleanArticle))),
  "texte réécrit en place : masqué tout de suite",
);
const layer = await changeThenRead(
  late,
  "insert",
  "#layers",
  `<div id="t5002">${mock.tweetHTML({ id: 5002, h: "user902", name: "U902", text: "go back home you dirty arabs", n: 0, hide: true })}</div>`,
  "#t5002 article",
);
check(
  layer === "hidden" && (await isHidden(late.locator("#t5002 article"))),
  "tweet ajouté dans #layers, hors de la colonne principale : masqué tout de suite",
);
if (mode === "legacy") {
  const cell = await changeThenRead(
    late,
    "insert",
    '[data-testid="sidebarColumn"] section',
    `<div id="c5003">${legacy.cellHTML({ h: "user903", name: "U903", bio: "les bougnoules dehors", hide: true })}</div>`,
    '#c5003 [data-testid="UserCell"]',
  );
  check(
    cell === "hidden" && (await isHidden(late.locator('#c5003 [data-testid="UserCell"]'))),
    "carte de compte ajoutée dans la colonne de droite : masquée tout de suite",
  );
}

// Un tweet haineux qui en cite un autre : une fois le premier affiché, le tweet
// cité ne doit être lisible sur aucune image.
const quoted = "Les sales arabes dehors";
await late.evaluate(
  (html) => document.getElementById("tl")?.insertAdjacentHTML("beforeend", `<div id="t5004">${html}</div>`),
  mock.tweetHTML({
    id: 5004,
    h: "user904",
    name: "U904",
    text: "rentre dans ton pays sale bougnoule",
    n: 0,
    hide: true,
    quote: { h: "user905", text: quoted, hide: true },
  }),
);
await late.waitForTimeout(100);
// Images où le texte cité est hors de tout voile, jusqu'à dix images après l'affichage.
const readableFrames = late.evaluate(
  (text) =>
    new Promise((done) => {
      const span = [...document.querySelectorAll("#t5004 span")].find((s) => s.textContent === text);
      const outer = document.querySelector("#t5004 article");
      let readable = 0;
      let after = 0;
      // Sans image ou sans affichage, le test échoue au lieu d'attendre sans fin.
      setTimeout(() => done(-1), 10000);
      const watch = () => {
        if (!span?.closest('[data-voyou-state="hidden"]')) readable++;
        if (outer?.getAttribute("data-voyou-state") === "revealed") after++;
        if (after < 10) requestAnimationFrame(watch);
        else done(readable);
      };
      requestAnimationFrame(watch);
    }),
  quoted,
);
await late.locator("#t5004 article").first().locator(':scope > .voyou-overlay [data-voyou-action="reveal"]').click();
const quoteBox = late.locator(mode === "legacy" ? '#t5004 div[role="link"]' : "#t5004 article article");
check(
  (await readableFrames) === 0 && (await isHidden(quoteBox)),
  "tweet cité d'un tweet qu'on affiche : flouté avant la prochaine image",
);

// Firefox retire content.css quand on désactive l'extension, sans laisser le
// script rien nettoyer : copiés dans un cadre sans cette feuille, les éléments
// traités, masqués ou révélés, ne montrent plus aucun bouton de Voyou.
const shownWithoutCss = await late.evaluate(() => {
  const frame = document.createElement("iframe");
  document.body.append(frame);
  const doc = /** @type {Document} */ (frame.contentDocument);
  for (const el of document.querySelectorAll("[data-voyou-state]")) doc.body.append(doc.importNode(el, true));
  // Le module, lui, est déplacé avec son Shadow DOM : son propre style le cache.
  const hud = document.getElementById("voyou-hud");
  if (hud) doc.body.append(hud);
  const shown = [...doc.querySelectorAll("#voyou-hud, .voyou-overlay, .voyou-rehide, .voyou-btn")].filter(
    (el) => el.getClientRects().length > 0,
  );
  frame.remove();
  return hud ? shown.length : -1;
});
check(shownWithoutCss === 0, `sans content.css, ni module ni bouton de Voyou affiché (${shownWithoutCss})`);

// Plus long que la passe de sécurité (3 s) : elle ne doit rien réécrire non plus.
const idle = await changesDuring(late, 3500);
check(idle === 0, `page au repos : ${idle} changement(s) en 3,5 s`);
await late.close();

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
  const badCell = profile.locator('[data-testid="UserCell"]').filter({ hasText: "@cell_bad" });
  const cellBox = await badCell.boundingBox();
  await profile.mouse.click((cellBox?.x ?? 0) + (cellBox?.width ?? 0) - 4, (cellBox?.y ?? 0) + 4);
  check(
    !!cellBox && (await takeOpened(profile)) === null && (await isHidden(badCell)),
    "un clic à côté du bouton d'une carte masquée n'ouvre pas le profil",
  );
  await profile.screenshot({ path: join(OUT, "legacy-profile.png"), fullPage: true });
  // X change de page sans recharger et garde la bio telle quelle : elle prend
  // son compte dans la nouvelle adresse dès la mutation suivante.
  const keyAfterNavigation = await profile.evaluate(async () => {
    history.pushState(null, "", "/autre_profil");
    document.getElementById("col")?.append(document.createElement("div"));
    await Promise.resolve();
    return document.querySelector('[data-testid="UserDescription"]')?.getAttribute("data-voyou-key");
  });
  check(keyAfterNavigation === "bio:autre_profil", `bio renotée avec la nouvelle adresse (${keyAfterNavigation})`);
  await profile.close();

  // Un tweet cité, même petit, a sa barre d'actions une fois révélé ; son
  // auteur, une fois autorisé, n'est plus masqué.
  console.log("legacy/tweet cité");
  const quotePage = await open(THREAD);
  const quoting = legacy.thread.find((t) => t.quote?.hide);
  const quote = quotePage.locator(`article:has(a[href="/${quoting?.h}/status/${quoting?.id}"]) div[role="link"]`);
  await quote.locator(':scope > .voyou-overlay [data-voyou-action="reveal"]').click();
  const quoteActions = await quote.evaluate((el) =>
    [...el.querySelectorAll(":scope > .voyou-rehide [data-voyou-action]")]
      .filter((button) => button.getClientRects().length > 0)
      .map((button) => button.getAttribute("data-voyou-action"))
      .join(),
  );
  check(quoteActions === "not-hate,allow,rehide", `tweet cité révélé : barre d'actions (${quoteActions})`);
  if (quoteActions.includes("rehide"))
    await quote.locator(':scope > .voyou-rehide [data-voyou-action="rehide"]').click();
  check((await isHidden(quote)) && (await takeOpened(quotePage)) === null, "« Masquer » remasque le tweet cité");
  const quoteStore = await context.newPage();
  await quoteStore.goto(POPUP);
  const quoted = quoting?.quote?.h;
  await quoteStore.evaluate((h) => chrome.storage.local.set({ allowedHandles: [h] }), quoted);
  await quotePage.waitForTimeout(500);
  check(!(await isHidden(quote)), `auteur cité autorisé (@${quoted}) : son tweet cité n'est plus masqué`);
  await quoteStore.evaluate(() => chrome.storage.local.remove("allowedHandles"));
  await quoteStore.close();
  await quotePage.close();

  console.log("legacy/module flottant");
  const page = await open("https://x.com/home");
  const isOpen = async () => (await page.getAttribute("#voyou-hud", "data-open")) === "true";
  await page.click("#voyou-hud");
  await page.waitForTimeout(300);
  check(await isOpen(), "un clic ouvre le panneau des filtres");
  await page.screenshot({ path: join(OUT, "legacy-panel.png") });
  // Le focus est entré dans le panneau ouvert : Tab et Maj+Tab y tournent.
  let stayed = true;
  for (const key of [...Array(25).fill("Tab"), ...Array(25).fill("Shift+Tab")]) {
    await page.keyboard.press(key);
    stayed &&= await page.evaluate(() => document.activeElement?.id === "voyou-hud");
  }
  check(stayed && (await isOpen()), "Tab et Maj+Tab restent dans le panneau ouvert");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  check(!(await isOpen()), "Échap réduit le panneau");
  await page.click("#voyou-hud");
  // Échap sert aussi aux menus de X : tapé dans la page, il ne touche pas au module.
  await page.evaluate(() => {
    const field = document.createElement("input");
    field.id = "x-field";
    document.body.append(field);
    field.focus();
  });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  check(
    (await isOpen()) && (await page.evaluate(() => document.activeElement?.id)) === "x-field",
    "Échap tapé dans X ne réduit pas le panneau et laisse le focus au champ de X",
  );
  await page.mouse.click(200, 200);
  await page.waitForTimeout(300);
  check(
    !(await isOpen()) && (await page.evaluate(() => document.activeElement?.id)) !== "voyou-hud",
    "un clic à côté réduit le panneau sans prendre le focus",
  );
  const before = await page.locator("#voyou-hud").boundingBox();
  const start = { x: (before?.x ?? 0) + 20, y: (before?.y ?? 0) + 18 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x - 150, start.y - 120, { steps: 8 });
  await page.mouse.up();
  const moved = await page.locator("#voyou-hud").boundingBox();
  check(
    !!before && !!moved && Math.abs(moved.x - before.x) > 100 && !(await isOpen()),
    "glisser déplace le module sans l'ouvrir",
  );
  // Petite fenêtre (zoom à 400 %) : le panneau ne sort pas de l'écran.
  await page.setViewportSize({ width: 320, height: 256 });
  await page.waitForTimeout(200);
  await page.click("#voyou-hud");
  await page.waitForTimeout(400);
  const [panelBox] = await shadowBoxes(page, "hud__panel");
  check(
    !!panelBox && panelBox.left >= 0 && panelBox.top >= 0 && panelBox.right <= 320 && panelBox.bottom <= 256,
    `petite fenêtre (320 × 256) : le panneau reste à l'écran (${JSON.stringify(panelBox)})`,
  );
  await page.close();

  console.log("legacy/module flottant, saisie");
  const typing = await open("https://x.com/home");
  const reader = await context.newPage();
  await reader.goto(POPUP);
  /** @param {string} key */
  const stored = (key) =>
    reader.evaluate(async (k) => /** @type {string[] | undefined} */ ((await chrome.storage.local.get(k))[k]), key);
  // Ce que verrait X : toute touche ou saisie qui arrive au document, et son
  // raccourci « ? », qui prend la touche quand la cible n'est pas un champ.
  await typing.evaluate(() => {
    const leaks = /** @type {string[]} */ ([]);
    /** @type {any} */ (window).leaks = leaks;
    for (const type of ["keydown", "keyup", "keypress", "beforeinput", "input"]) {
      document.addEventListener(type, () => leaks.push(type));
    }
    document.addEventListener("keydown", (event) => {
      const target = event.target;
      const field =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      if (event.key === "?" && !field) event.preventDefault();
    });
  });
  // Le panneau vit dans un Shadow DOM fermé : on y entre au clavier. Le clic
  // met le focus sur sa première commande ; Maj+Tab mène à la pastille, puis,
  // en faisant le tour, au dernier champ : comptes autorisés.
  await typing.click("#voyou-hud");
  await typing.keyboard.press("Shift+Tab");
  await typing.keyboard.press("Shift+Tab");
  await typing.keyboard.type("@user901");
  await typing.keyboard.press("Enter");
  await typing.waitForTimeout(700);
  await typing.keyboard.type("@user902");
  // Mots à masquer.
  await typing.keyboard.press("Shift+Tab");
  await typing.keyboard.type("mot ");
  await typing.waitForTimeout(700);
  const unfinished = await stored("customTerms");
  await typing.keyboard.type("clé");
  await typing.keyboard.press("Enter");
  await typing.keyboard.type("motdeux");
  await typing.keyboard.press("Enter");
  await typing.waitForTimeout(700);
  // Retour à la fin de « motdeux », déjà enregistré.
  await typing.keyboard.press("Backspace");
  await typing.waitForTimeout(700);
  const kept = await stored("customTerms");
  await typing.keyboard.press("Enter");
  await typing.keyboard.type("motrois?");
  await typing.keyboard.press("Escape");
  await typing.waitForTimeout(300);
  check(
    JSON.stringify(await stored("allowedHandles")) === '["user901","user902"]',
    "deux comptes tapés avec une pause entre eux",
  );
  check(!unfinished?.length, "un mot en cours de frappe n'est pas encore enregistré");
  check(
    JSON.stringify(kept) === '["mot clé","motdeux"]',
    "une pause après l'espace ne colle pas les mots, revenir sur une ligne ne la retire pas",
  );
  check(
    JSON.stringify(await stored("customTerms")) === '["mot clé","motdeux","motrois?"]',
    "le mot en cours est gardé en sortant, « ? » compris",
  );
  const leaks = await typing.evaluate(() => /** @type {string[]} */ (/** @type {any} */ (window).leaks));
  check(leaks.length === 0, `aucune touche tapée dans le module n'arrive à la page (${leaks.length})`);
  await reader.evaluate(() => chrome.storage.local.remove(["customTerms", "allowedHandles"]));
  await reader.close();
  await typing.close();

  console.log("legacy/langue de X");
  const english = await open("https://x.com/home?lang=en");
  const englishButton = await english.locator('[data-voyou-action="reveal"]').first().textContent();
  check(englishButton === readMessages("en").reveal.message, `X en anglais : « ${englishButton} »`);
  // Images où il manque des voiles, pendant les trente qui suivent le changement de langue.
  const unveiledFrames = english.evaluate(
    () =>
      new Promise((done) => {
        const hidden = () => document.querySelectorAll('[data-voyou-state="hidden"]').length;
        const initial = hidden();
        let unveiled = 0;
        let frames = 0;
        setTimeout(() => done(-1), 10000);
        const watch = () => {
          if (hidden() < initial) unveiled++;
          if (++frames < 30) requestAnimationFrame(watch);
          else done(unveiled);
        };
        requestAnimationFrame(watch);
      }),
  );
  await english.evaluate(() => document.documentElement.setAttribute("lang", "es"));
  const unveiled = await unveiledFrames;
  const spanishButton = await english.locator('[data-voyou-action="reveal"]').first().textContent();
  check(spanishButton === readMessages("es").reveal.message, `langue changée dans X : « ${spanishButton} »`);
  check(unveiled === 0, "voiles refaits dans la nouvelle langue sans image où ils manquent");
  // Deux changements à une tâche d'écart : le second montage remplace le premier.
  await english.evaluate(async () => {
    document.documentElement.setAttribute("lang", "pt");
    await new Promise((done) => setTimeout(done));
    document.documentElement.setAttribute("lang", "en");
  });
  await english.waitForTimeout(800);
  const panels = (await shadowBoxes(english, "panel")).length;
  check(panels === 1, `deux changements de langue rapprochés : un seul panneau (${panels})`);
  await english.close();
  // Revenir sur une page en français pour la suite (la popup reprend la dernière langue vue).
  await (await open("https://x.com/home")).close();

  console.log("legacy/thème sombre");
  const dark = await open("https://x.com/home?dark");
  check((await dark.getAttribute("html", "data-voyou-theme")) === "dark", "thème sombre reconnu");
  await dark.screenshot({ path: join(OUT, "legacy-dark.png"), fullPage: true });
  await dark.close();

  // Firefox réinjecte le script dans les onglets ouverts sans rien laisser
  // exécuter à l'ancien : la nouvelle instance reprend son module et ses voiles.
  console.log("legacy/reprise après une instance tuée");
  const resumed = await open("https://x.com/home?reprise");
  const hiddenOnPage = await resumed.locator('[data-voyou-state="hidden"]').count();
  check(
    (await resumed.locator("#voyou-hud").count()) === 1 &&
      (await resumed.getAttribute("#voyou-hud", "data-count")) === String(hiddenOnPage),
    "un seul module flottant, celui de la nouvelle instance",
  );
  check(
    !(await resumed.locator("#stale").getAttribute("data-voyou-state")) &&
      (await resumed.locator("#stale > .voyou-overlay").count()) === 0 &&
      (await resumed.locator("#stale > [aria-hidden]").count()) === 0,
    "voile de l'ancienne instance retiré",
  );
  await resumed.close();

  // Autoriser un compte ne change aucun verdict : les voiles des autres tweets
  // restent en place, et le compteur garde les tweets masqués que X a retirés
  // du DOM pendant le défilement.
  console.log("legacy/compte autorisé absent de la page");
  const keptPage = await open("https://x.com/home");
  const countBefore = await keptPage.getAttribute("#voyou-hud", "data-count");
  await keptPage.evaluate(() => {
    const [first, second] = document.querySelectorAll('[data-voyou-state="hidden"]');
    first?.querySelector(":scope > .voyou-overlay")?.setAttribute("data-test-mark", "");
    second?.closest('[data-testid="cellInnerDiv"]')?.remove();
  });
  const allowPopup = await context.newPage();
  await allowPopup.goto(POPUP);
  // La ligne en cours de saisie n'est enregistrée qu'en quittant le champ.
  await allowPopup.locator('[data-field="allowed"]').fill("@user999");
  await allowPopup.locator('[data-field="allowed"]').blur();
  await allowPopup.waitForTimeout(800);
  const saved = await allowPopup.evaluate(
    async () => (await chrome.storage.local.get("allowedHandles")).allowedHandles,
  );
  await allowPopup.close();
  check(
    JSON.stringify(saved) === '["user999"]' &&
      (await keptPage.locator("[data-test-mark]").count()) === 1 &&
      (await keptPage.getAttribute("#voyou-hud", "data-count")) === countBefore,
    `compte autorisé enregistré, voiles et compteur gardés (${countBefore})`,
  );
  await keptPage.close();

  // Le compteur dit ce qui est masqué sur la page : X qui change de page sans
  // recharger le remet à zéro, mais une fenêtre ouverte par-dessus le fil
  // (photo) le laisse tel quel.
  console.log("legacy/compteur de la page");
  const nav = await open("https://x.com/home");
  const onHome = await nav.getAttribute("#voyou-hud", "data-count");
  await nav.evaluate(async () => {
    history.pushState(null, "", "/randomguy1/status/1001/photo/1");
    document.getElementById("layers")?.append(document.createElement("div"));
    await Promise.resolve();
  });
  await nav.waitForTimeout(100);
  const overPhoto = await nav.getAttribute("#voyou-hud", "data-count");
  await nav.evaluate(
    (html) => {
      history.pushState(null, "", "/explore");
      document.getElementById("tl")?.replaceChildren();
      document.getElementById("tl")?.insertAdjacentHTML("beforeend", html);
    },
    mock.tweetHTML({ id: 1006, h: "newsfr", name: "Actu", text: "Programme télé de la semaine", n: 0, hide: false }),
  );
  await nav.waitForTimeout(300);
  const onExplore = await nav.getAttribute("#voyou-hud", "data-count");
  check(
    onHome !== "0" && overPhoto === onHome && onExplore === "0",
    `compteur de la page : ${onHome} sur l'accueil, ${overPhoto} sous une photo, ${onExplore} ailleurs`,
  );
  await nav.close();

  console.log("legacy/popup");
  const allowedHandle = mock.thread.find((t) => t.hide)?.h ?? "";
  const popup = await context.newPage();
  await popup.goto(POPUP);
  // Un second panneau ouvert en même temps, comme le module d'un onglet X.
  const second = await context.newPage();
  await second.goto(POPUP);
  await second.getByText(msg("popupOn")).waitFor();
  await second.evaluate(() => {
    /** @type {any} */ (window).stateText = document.querySelector(".panel__state")?.firstChild;
  });
  /**
   * Cases des filtres, cochées ou non, dans l'ordre affiché.
   * @param {Page} page
   */
  const filterBoxes = (page) =>
    page
      .locator(".toggle__input")
      .evaluateAll((inputs) => inputs.map((input) => /** @type {HTMLInputElement} */ (input).checked));
  const storedCategories = () => popup.evaluate(async () => (await chrome.storage.local.get("categories")).categories);
  await popup.getByText(msg("category_profanity"), { exact: true }).click();
  await popup.getByText(msg("category_insult"), { exact: true }).click();
  await popup.waitForTimeout(300);
  check(
    JSON.stringify(await storedCategories()) === '["racism","hate","threat","profanity"]',
    "deux filtres changés d'affilée : les deux sont enregistrés",
  );
  check(
    JSON.stringify(await filterBoxes(second)) === "[true,true,true,false,true]",
    "un autre panneau suit les filtres",
  );
  await second.getByText(msg("category_insult"), { exact: true }).click();
  await second.getByText(msg("sensitivity_high"), { exact: true }).click();
  await popup.waitForTimeout(300);
  check(
    JSON.stringify(await storedCategories()) === '["racism","hate","threat","insult","profanity"]',
    "un clic dans l'autre panneau garde les filtres changés ici",
  );
  check(
    await popup.getByRole("radio", { name: msg("sensitivity_high") }).isChecked(),
    "un autre panneau suit la sensibilité",
  );
  await popup.getByText(msg("sensitivity_medium"), { exact: true }).click();
  check((await popup.locator("[aria-live]").count()) === 1, "seul l'état est annoncé aux lecteurs d'écran");
  await popup.emulateMedia({ colorScheme: "dark" });
  check(
    (await popup.locator(".panel.is-dark").evaluate((panel) => getComputedStyle(panel).colorScheme)) === "dark",
    "thème sombre : cases à cocher et barres de défilement sombres aussi",
  );
  await popup.emulateMedia({ colorScheme: "light" });
  await popup.locator(".panel:not(.is-dark)").waitFor();
  await popup.locator('[data-field="allowed"]').fill(`@${allowedHandle}`);
  await popup.screenshot({ path: join(OUT, "popup.png"), fullPage: true });
  // Fermée sans quitter le champ, comme d'un clic sur la page : la saisie est gardée.
  await popup.close();
  await second.waitForTimeout(300);
  check(
    (await second.locator('[data-field="allowed"]').inputValue()) === `@${allowedHandle}`,
    "popup fermée juste après la saisie : le compte est enregistré",
  );
  check(
    await second.evaluate(
      () => document.querySelector(".panel__state")?.firstChild === /** @type {any} */ (window).stateText,
    ),
    "l'état n'est pas réécrit, donc pas relu, à chaque enregistrement",
  );
  await second.close();
  /** @param {Tweet} t */
  const withSettings = (t) => (t.h === allowedHandle ? false : t.hide || t.profanity === true);
  const settingsPage = await checkTweets("réglages (vulgarité + compte autorisé)", THREAD, mock.thread, withSettings);

  console.log("legacy/actions");
  const notHate = await revealFirst(settingsPage);
  // Un clic fabriqué par le JavaScript de la page ne change aucun réglage.
  const store = await context.newPage();
  await store.goto(POPUP);
  const readStore = () =>
    store.evaluate(async () => JSON.stringify(await chrome.storage.local.get(["mutedRules", "allowedHandles"])));
  const beforeForged = await readStore();
  await notHate.evaluate((el) => {
    for (const action of ["not-hate", "allow"]) {
      /** @type {HTMLElement | null} */ (el.querySelector(`[data-voyou-action="${action}"]`))?.click();
    }
  });
  await settingsPage.waitForTimeout(300);
  check(
    (await readStore()) === beforeForged && (await settingsPage.locator("[data-voyou-author]").count()) === 0,
    "un clic fabriqué par la page ne change aucun réglage",
  );
  await store.close();
  await notHate.locator('[data-voyou-action="not-hate"]').click();
  await settingsPage.waitForTimeout(300);
  const allow = await revealFirst(settingsPage);
  const allowLabel = (await allow.locator('[data-voyou-action="allow"]').textContent()) ?? "";
  await allow.locator('[data-voyou-action="allow"]').click();
  await settingsPage.waitForTimeout(2500);
  check(
    (await takeOpened(settingsPage)) === null,
    "« Ce n'est pas de la haine » et « Autoriser » n'ouvrent pas le post",
  );
  await settingsPage.close();

  const after = await context.newPage();
  await after.goto(POPUP);
  await after.waitForTimeout(500);
  check((await after.locator(".muted__item").count()) > 0, "« Ce n'est pas de la haine » ajoute des règles ignorées");
  /** @param {string} key message dont les paramètres peuvent valoir n'importe quel texte */
  const anyValues = (key) =>
    new RegExp(`^${messages[key].message.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\$[A-Z]+\\\$/g, ".+")}$`);
  const ruleFormats = ["mutedTerm", "mutedPattern", "mutedPatternAnyLanguage"].map(anyValues);
  const ruleLabels = await after.locator(".muted__item > span").allTextContents();
  check(
    ruleLabels.every((label) => ruleFormats.some((format) => format.test(label))),
    "règles ignorées : des libellés traduits, pas les notes des listes",
  );
  const allowed = await after.locator('[data-field="allowed"]').inputValue();
  check(
    allowed.includes(allowLabel.match(/@\w+/)?.[0] ?? "?"),
    `« ${allowLabel} » ajoute le compte aux comptes autorisés`,
  );
  // Au moins les éléments masqués de la page des réglages : seule ouverte à ce
  // moment-là, elle l'est restée assez longtemps pour que ses statistiques soient écrites.
  const total = (await after.locator(".stats__total").textContent()) ?? "";
  const counted = Number(total.match(/\d+/)?.[0] ?? 0);
  check(
    counted >= expectedCount(mock.thread, withSettings) &&
      total === msg(counted > 1 ? "popupStatsTotalMany" : "popupStatsTotalOne", counted),
    `statistiques : « ${total} »`,
  );
  await after.screenshot({ path: join(OUT, "popup-after.png"), fullPage: true });
  await after.close();

  console.log("legacy/accès à x.com");
  // Comme « Accès au site : au clic » dans chrome://extensions : le script ne tourne plus sur x.com.
  const extensions = await context.newPage();
  await extensions.goto("chrome://extensions");
  /** @param {"ON_CLICK" | "ON_ALL_SITES"} hostAccess */
  const setHostAccess = (hostAccess) =>
    extensions.evaluate(
      ([id, access]) =>
        /** @type {any} */ (chrome).developerPrivate.updateExtensionConfiguration({
          extensionId: id,
          hostAccess: access,
        }),
      [extensionId, hostAccess],
    );
  await setHostAccess("ON_CLICK");
  const noAccess = await context.newPage();
  await noAccess.goto(POPUP);
  await noAccess.waitForTimeout(300);
  check(
    (await noAccess.locator(".panel__state").textContent()) === msg("popupNoAccess"),
    "sans accès à x.com, la popup le dit",
  );
  // La vraie demande ouvre une fenêtre du navigateur qu'on ne peut pas accepter ici.
  const requested = await noAccess.evaluate(
    () =>
      new Promise((resolve) => {
        /** @type {any} */ (chrome.permissions).request = (/** @type {chrome.permissions.Permissions} */ asked) => {
          resolve(asked.origins);
          return Promise.resolve(false);
        };
        /** @type {HTMLElement} */ (document.querySelector(".panel__grant")).click();
      }),
  );
  check(JSON.stringify(requested) === '["https://x.com/*"]', "et propose de l'accorder");
  await setHostAccess("ON_ALL_SITES");
  await noAccess.waitForTimeout(300);
  check(
    (await noAccess.locator(".panel__state").textContent()) === msg("popupOn") &&
      (await noAccess.getByText(msg("popupGrantHint")).isVisible()) &&
      !(await noAccess.locator(".panel__grant").isVisible()),
    "accès accordé : la popup dit de recharger X",
  );
  await noAccess.close();
  await extensions.close();

  // Recharger l'extension (le ↻ de chrome://extensions) laisse l'ancien script
  // dans les onglets ouverts, coupé de l'extension. Il arrête ce qui touche
  // chrome.*, son module disparaît, mais il continue de flouter.
  console.log("legacy/rechargement de l'extension");
  const orphan = await open("https://x.com/home");
  const revealedBeforeReload = await revealFirst(orphan);
  const reloader = await context.newPage();
  await reloader.goto(POPUP);
  await reloader.evaluate(() => chrome.runtime.reload()).catch(() => {});
  await orphan.waitForTimeout(7000);
  check((await orphan.locator("#voyou-hud").count()) === 0, "l'ancien script retire son module");
  const offered = await revealedBeforeReload.evaluate((el) =>
    [...el.querySelectorAll(":scope > .voyou-rehide [data-voyou-action]")]
      .filter((button) => button.getClientRects().length > 0)
      .map((button) => button.getAttribute("data-voyou-action"))
      .join(),
  );
  check(offered === "rehide", `sous un tweet révélé, seul « Masquer » reste proposé (${offered})`);
  const orphanState = await changeThenRead(
    orphan,
    "insert",
    "#tl",
    `<div id="t5005">${mock.tweetHTML({ id: 5005, h: "user906", name: "U906", text: "sale bougnoule", n: 0, hide: true })}</div>`,
    "#t5005 article",
  );
  check(
    orphanState === "hidden" && (await isHidden(orphan.locator("#t5005 article"))),
    "un tweet haineux arrivé ensuite est quand même masqué",
  );
  await orphan.close();
}
await context.close();
rmSync(profileDir, { recursive: true, force: true });

console.log(failures ? `${failures} échec(s)` : `Tests DOM ${mode} : tout est OK`);
process.exitCode = failures ? 1 : 0;
