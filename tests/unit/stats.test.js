/**
 * Statistiques locales : écritures regroupées sans être repoussées, aucun
 * compteur perdu quand plusieurs onglets X écrivent en même temps, et des
 * périodes comptées en jours de calendrier, justes autour des changements
 * d'heure.
 *
 * Le stockage, les minuteries, le verrou entre onglets et l'horloge sont
 * simulés. Le fuseau est celui de Paris, pour tomber sur de vrais changements
 * d'heure (29 mars et 25 octobre 2026).
 */
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

process.env.TZ = "Europe/Paris";

const RealDate = Date;
/**
 * Un instant de 2026, à l'heure de Paris.
 * @param {number} month
 * @param {number} day
 * @param {number} [hour]
 * @param {number} [minute]
 */
const paris = (month, day, hour = 12, minute = 0) => new RealDate(2026, month - 1, day, hour, minute).getTime();

let clock = 0;
/** @type {Record<string, unknown>} */
let stored = {};
let writes = 0;
/** @type {{ id: number, at: number, run: () => void }[]} */
let timers = [];
let timerIds = 0;

// Chaque appel au stockage rend la main avant de répondre, comme le vrai :
// deux onglets peuvent lire la même valeur avant que l'un d'eux écrive.
const tick = () => new Promise((resolve) => setImmediate(resolve));
const settle = async () => {
  for (let i = 0; i < 20; i++) await tick();
};
const local = {
  /** @param {string} key */
  async get(key) {
    await tick();
    return key in stored ? { [key]: structuredClone(stored[key]) } : {};
  },
  /** @param {Record<string, unknown>} items */
  async set(items) {
    await tick();
    writes++;
    stored = { ...stored, ...structuredClone(items) };
  },
};

/** @type {(() => void)[]} */
const visibilityListeners = [];
const fakeDocument = {
  visibilityState: "visible",
  /** @param {string} type @param {() => void} listener */
  addEventListener(type, listener) {
    if (type === "visibilitychange") visibilityListeners.push(listener);
  },
};

/** @type {Map<string, Promise<unknown>>} */
const lockQueues = new Map();
Object.defineProperty(navigator, "locks", {
  configurable: true,
  value: {
    // Comme navigator.locks : une tâche à la fois par nom de verrou.
    /** @param {string} name @param {() => Promise<unknown>} task */
    request(name, task) {
      const run = (lockQueues.get(name) ?? Promise.resolve()).then(task);
      // La tâche suivante attend la fin de celle-ci, même si elle échoue.
      const ended = run.catch(() => undefined);
      lockQueues.set(name, ended);
      return run;
    },
  },
});

Object.assign(globalThis, {
  Date: new Proxy(RealDate, {
    construct: (target, args) => Reflect.construct(target, args.length ? args : [clock]),
    get: (target, property, receiver) => (property === "now" ? () => clock : Reflect.get(target, property, receiver)),
  }),
  chrome: { runtime: { id: "voyou" }, storage: { local } },
  document: fakeDocument,
  window: {
    /** @param {() => void} run @param {number} ms */
    setTimeout(run, ms) {
      timers.push({ id: ++timerIds, at: clock + ms, run });
      return timerIds;
    },
    /** @param {number} id */
    clearTimeout(id) {
      timers = timers.filter((timer) => timer.id !== id);
    },
  },
});

/**
 * Le script de page d'un onglet X : chaque onglet a sa propre copie du module.
 * @param {string} name
 * @returns {Promise<typeof import("../../extension/stats.js")>}
 */
const openTab = (name) => import(new URL(`../../extension/stats.js?onglet=${name}`, import.meta.url).href);
const tab = await openTab("a");
const otherTab = await openTab("b");

/**
 * Avance l'horloge et déclenche les minuteries arrivées à échéance. Celles qui
 * tombent au même instant partent ensemble, comme dans deux onglets.
 * @param {number} ms
 */
async function advance(ms) {
  const end = clock + ms;
  for (;;) {
    const at = Math.min(...timers.map((timer) => timer.at));
    if (!(at <= end)) break;
    clock = at;
    const due = timers.filter((timer) => timer.at === at);
    timers = timers.filter((timer) => timer.at !== at);
    for (const timer of due) timer.run();
    await settle();
  }
  clock = end;
}

/** Tous les onglets passent en arrière-plan, puis reviennent. */
async function hideTabs() {
  fakeDocument.visibilityState = "hidden";
  for (const listener of visibilityListeners) listener();
  await settle();
  fakeDocument.visibilityState = "visible";
}

/**
 * Un compteur par jour, de firstDaysAgo jours avant aujourd'hui jusqu'à
 * lastDaysAgo (négatif : dans le futur).
 * @param {number} firstDaysAgo
 * @param {number} lastDaysAgo
 */
function storeOnePerDay(firstDaysAgo, lastDaysAgo) {
  /** @type {Record<string, Record<string, number>>} */
  const stats = {};
  for (let n = firstDaysAgo; n >= lastDaysAgo; n--) {
    const today = new Date();
    stats[tab.dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - n))] = { racism: 1 };
  }
  stored = { stats };
}

beforeEach(() => {
  clock = paris(10, 29);
  stored = {};
  writes = 0;
});

// Rien ne doit rester en attente d'un test à l'autre.
afterEach(hideTabs);

test("pendant un défilement continu, les compteurs sont écrits au fil de l'eau", async () => {
  for (let second = 0; second < 8; second++) {
    tab.recordHidden("racism");
    await advance(1000);
  }
  // Une écriture toutes les deux secondes, sans attendre que les masquages cessent.
  assert.equal(writes, 4);
  assert.deepEqual(await tab.readStats(7), { total: 8, byCategory: { racism: 8 } });
});

test("un onglet caché écrit tout de suite, sans attendre la fin du délai", async () => {
  tab.recordHidden("insult");
  tab.recordHidden("insult");
  tab.recordHidden("threat");
  await hideTabs();
  assert.deepEqual(await tab.readStats(7), { total: 3, byCategory: { insult: 2, threat: 1 } });
});

test("deux onglets qui écrivent en même temps ne perdent aucun compteur", async () => {
  for (let i = 0; i < 3; i++) tab.recordHidden("racism");
  for (let i = 0; i < 4; i++) otherTab.recordHidden("racism");
  await advance(2000);
  assert.equal((await tab.readStats(7)).total, 7);
});

test("7 derniers jours : 7 jours de calendrier, même après le passage à l'heure d'été", async () => {
  clock = paris(4, 4, 0, 30);
  storeOnePerDay(9, 0);
  assert.equal((await tab.readStats(7)).total, 7);
});

test("7 derniers jours : 7 jours de calendrier, même après le retour à l'heure d'hiver", async () => {
  clock = paris(10, 30, 23, 30);
  storeOnePerDay(9, 0);
  assert.equal((await tab.readStats(7)).total, 7);
});

test("le lendemain compte (voyage vers l'ouest), pas les jours plus lointains", async () => {
  storeOnePerDay(0, -3);
  assert.equal((await tab.readStats(7)).total, 2);
});

test("à l'écriture, seuls les 30 derniers jours sont gardés, plus le lendemain", async () => {
  storeOnePerDay(40, -3);
  /** @type {Record<string, unknown>} */ (stored.stats)["pas-un-jour"] = { racism: 1 };
  tab.recordHidden("hate");
  await hideTabs();
  const days = Object.keys(/** @type {object} */ (stored.stats)).sort();
  assert.equal(days.length, 31);
  assert.equal(days[0], "2026-09-30");
  assert.equal(days.at(-1), "2026-10-30");
});

test("pruneStats efface les jours trop anciens sans attendre un masquage, et seulement s'il y en a", async () => {
  storeOnePerDay(35, 0);
  await tab.pruneStats();
  assert.equal(Object.keys(/** @type {object} */ (stored.stats)).length, 30);
  assert.equal(writes, 1);
  await tab.pruneStats();
  assert.equal(writes, 1);
});
