// Page qui imite le nouveau client « x-web » de X, relevé sur le vrai site :
// pas de data-testid, pas de #react-root, texte dans des div[dir=auto]. Le
// tweet cité (un <article> imbriqué) et les notifications (des articles sans
// lien vers eux-mêmes) suivent ce qu'en suppose x-dom.js : leur forme n'a pas
// été relevée.
// hide : ce que Voyou doit faire de chaque tweet ou tweet cité.
/**
 * @typedef {object} Quote tweet cité, un <article> imbriqué
 * @property {string} h compte de l'auteur
 * @property {string} [name] nom d'affichage, « Cité » sinon
 * @property {string | number} [id] id du post : l'heure du tweet cité devient un lien vers lui
 * @property {string} text
 * @property {boolean} hide
 *
 * @typedef {object} Tweet
 * @property {string | number} id
 * @property {string} h compte de l'auteur
 * @property {string} name
 * @property {string} text vide pour un tweet sans texte (photo seule)
 * @property {number} n nombre de réponses
 * @property {boolean} hide
 * @property {string} [replyTo]
 * @property {boolean} [focused] tweet ouvert : son heure n'est pas un lien
 * @property {boolean} [profanity] juron seul : masqué seulement avec le filtre vulgarité
 * @property {Quote} [quote]
 */
/** @param {Tweet} t */
export function tweetHTML(t) {
  const status = t.focused
    ? ""
    : `<a href="/${t.h}/status/${t.id}"><time datetime="2026-10-28T08:00:00.000Z">1 h</time></a>`;
  const q = t.quote;
  const quote = q
    ? `<article><div><a href="/${q.h}"><div>${q.name ?? "Cité"}</div></a>${q.id ? `<a href="/${q.h}/status/${q.id}"><time datetime="2026-10-28T07:00:00.000Z">2 h</time></a>` : ""}</div><div dir="auto"><span>${q.text}</span></div></article>`
    : "";
  return `<div class="flex"><article class="flex flex-col"><div><div><div><div><div><a href="/${t.h}"><div><img alt="@${t.h}" src="data:,"></div></a></div></div>
<div><div><div><span><a href="/${t.h}"><div>${t.name}</div></a></span><span><a href="/${t.h}"><span>@${t.h}</span></a></span>${status}</div>
<div><button aria-label="Plus" type="button"></button></div></div></div></div>
<div dir="auto"><span>${t.text}</span></div>${quote}
<div><button aria-label="${t.n} réponses" type="button"><span>${t.n}</span></button></div></div></div></article></div>`;
}

/** @param {import("./mock-legacy.js").Notification} n */
export const notificationHTML = (n) =>
  `<div class="flex"><article class="flex"><div><a href="/${n.h}"><div><img alt="@${n.h}" src="data:,"></div></a></div><div><span><a href="/${n.h}"><div>${n.name}</div></a></span><span>${n.post ? " a aimé votre post" : " vous suit"}</span></div>${n.post ? `<div dir="auto"><span>${n.post}</span></div>` : ""}</article></div>`;

/**
 * @typedef {object} PageOptions
 * @property {string} [cells] cellules déjà dans le fil au chargement (notifications)
 * @property {boolean} [menu] menu de X, avec le lien vers le profil de l'utilisateur
 * @property {string} [tabs] compte d'un profil visité : ses onglets au-dessus du fil
 */
/**
 * Comme React sur X, un écouteur délégué ouvre le post où l'on clique. Ici, un
 * repère sur <html> (data-opened) tient lieu de navigation.
 */
const OPENS = `for(const type of ['click','auxclick'])document.addEventListener(type,e=>{if(e.target instanceof Element&&e.target.closest('article'))document.documentElement.dataset.opened=type;});`;
/**
 * Le fil est dans <main> ; #layers (photos, fenêtres de réponse) est à côté.
 * @param {Tweet[]} tweets
 * @param {string} title
 * @param {PageOptions} [options]
 */
export function page(tweets, title, { cells = "", menu = true, tabs = "" } = {}) {
  const nav = menu
    ? `<nav><a href="/home">Accueil</a><a href="/explore">Explorer</a><a href="/moncompte" aria-label="Profil">Profil</a></nav>`
    : "";
  const profileTabs = tabs
    ? `<nav aria-label="Onglets du profil"><a href="/${tabs}" role="tab">Posts</a><a href="/${tabs}/with_replies" role="tab">Réponses</a></nav>`
    : "";
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title></head><body><div id="root">
${nav}
<main>${profileTabs}<div id="tl">${cells}</div></main><div id="layers"></div></div>
<script>${OPENS}const T=${JSON.stringify(tweets)};const A=${tweetHTML.toString()};
setTimeout(()=>{const tl=document.getElementById('tl');T.slice(0,2).forEach(t=>tl.insertAdjacentHTML('beforeend',A(t)));},300);
setTimeout(()=>{const tl=document.getElementById('tl');T.slice(2).forEach(t=>tl.insertAdjacentHTML('beforeend',A(t)));},900);
</script></body></html>`;
}
export const timeline = [
  { id: 3001, h: "troll1", name: "T1", text: "Les sales arabes dehors", n: 2, hide: true },
  { id: 3002, h: "ami", name: "Ami", text: "Super fil, merci pour les sources", n: 1, hide: false },
  { id: 3003, h: "troll2", name: "T2", text: "go back to africa you dirty arab", n: 0, hide: true },
  { id: 3004, h: "news", name: "News", text: "Météo : soleil demain sur Lyon", n: 4, hide: false },
  { id: 3005, h: "troll3", name: "T3", text: "we should be killing them all", n: 0, hide: true },
];
export const thread = [
  {
    id: 4000,
    h: "moncompte",
    name: "Moi",
    text: "Mon post sur le racisme ordinaire (sale arabe, on me disait)",
    n: 500,
    focused: true,
    hide: false,
  },
  { id: 4001, h: "troll4", name: "T4", text: "sale bougnoule", n: 0, hide: true },
  { id: 4002, h: "ami2", name: "A2", text: "Je suis d’accord avec toi", n: 0, hide: false },
  { id: 4003, h: "troll5", name: "T5", text: "votre post est nul, retourne dans ton pays", n: 0, hide: true },
  { id: 4004, h: "troll6", name: "T6", text: "va pleurer ailleurs sale gauchiste", n: 0, hide: true },
  { id: 4005, h: "troll7", name: "T7", text: "Diese Leute sind Abschaum", n: 0, hide: true },
  { id: 4006, h: "user123", name: "U123", text: "s a l e  a r a b e", n: 0, hide: true },
  { id: 4007, h: "user456", name: "U456", text: "t'es qu'un 🦍", n: 0, hide: true },
  { id: 4008, h: "user789", name: "U789", text: "Trop la honte 🙈🙈", n: 0, hide: false },
  {
    id: 4009,
    h: "user555",
    name: "U555",
    text: "putain de journée, rien ne marche",
    n: 0,
    hide: false,
    profanity: true,
  },
  {
    id: 4010,
    h: "user321",
    name: "U321",
    text: "Regardez ce que j'ai reçu, c'est honteux",
    n: 0,
    hide: false,
    quote: { h: "troll8", text: "rentre dans ton pays sale arabe", hide: true },
  },
  // Sous un tweet masqué, le tweet cité n'a pas de voile à lui.
  {
    id: 4011,
    h: "troll9",
    name: "T9",
    text: "rentre dans ton pays sale bougnoule",
    n: 0,
    hide: true,
    quote: { h: "troll10", text: "Les sales arabes dehors", hide: true },
  },
  // Le post de l'utilisateur, cité par un autre, n'est jamais masqué.
  {
    id: 4012,
    h: "user654",
    name: "U654",
    text: "Courage à toi, c'est inadmissible",
    n: 0,
    hide: false,
    quote: {
      h: "moncompte",
      name: "Moi",
      text: "Aujourd'hui on m'a traité de sale bougnoule dans le métro",
      hide: false,
    },
  },
  {
    id: 4013,
    h: "user852",
    name: "U852",
    text: "Je ne comprends pas cette réponse",
    n: 0,
    hide: false,
    quote: { h: "troll11", name: "Sale bougnoule", text: "Bonne journée à tous", hide: true },
  },
  // Un tweet sans texte (photo seule) qui cite : seul le tweet cité est masqué.
  {
    id: 4014,
    h: "ami_photo",
    name: "Ami photo",
    text: "",
    n: 0,
    hide: false,
    quote: { h: "troll12", text: "rentre dans ton pays sale arabe", hide: true },
  },
];
