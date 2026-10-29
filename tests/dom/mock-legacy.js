// Page minimale qui imite l'ancien DOM de X (avec data-testid). Les tweets sont
// insérés après le chargement, comme le fait l'application React de X, et les
// emojis sont des <img alt>, comme sur le vrai site.
// hide : ce que Voyou doit faire de chaque tweet, tweet cité ou carte.
/**
 * @typedef {object} Quote tweet cité, sans lien dans son bloc nom : son auteur ne se lit que dans le texte
 * @property {string} h compte de l'auteur
 * @property {string} [name] nom d'affichage, « Cité » sinon
 * @property {string} text vide pour un tweet cité fait d'un sondage seul
 * @property {string[]} [poll] options d'un sondage
 * @property {boolean} hide
 *
 * @typedef {object} Card carte d'un lien
 * @property {string} title titre de la page liée
 * @property {boolean} hide
 *
 * @typedef {object} Tweet
 * @property {string | number} id
 * @property {string} h compte de l'auteur
 * @property {string} name
 * @property {string} text vide pour un tweet sans texte (photo seule, lien seul)
 * @property {number} n nombre de réponses
 * @property {boolean} hide
 * @property {string} [replyTo]
 * @property {boolean} [focused]
 * @property {boolean} [profanity] juron seul : masqué seulement avec le filtre vulgarité
 * @property {{ h: string, name: string }} [repostedBy] compte qui l'a reposté, nommé au-dessus
 * @property {string[]} [poll] options d'un sondage, sous sa question
 * @property {Card} [card]
 * @property {Quote} [quote]
 */
/** @param {Tweet} t */
export function tweetHTML(t) {
  /** @param {string} text */
  const emojis = (text) => text.replace(/\p{Extended_Pictographic}/gu, (e) => `<img alt="${e}" src="data:,">`);
  /** @param {string[] | undefined} options */
  const poll = (options) =>
    options
      ? `<div data-testid="card.wrapper"><div data-testid="cardPoll">${options.map((o) => `<div role="radio" aria-checked="false"><span>${o}</span></div>`).join("")}<div><span>12 votes</span><span>·</span><span>2 jours restants</span></div></div></div>`
      : "";
  const context = t.repostedBy
    ? `<div><a href="/${t.repostedBy.h}" role="link"><span data-testid="socialContext">${emojis(t.repostedBy.name)} a reposté</span></a></div>`
    : "";
  const reply = t.replyTo
    ? `<div dir="ltr" class="r-ctx">En réponse à <a href="/${t.replyTo}" role="link">@${t.replyTo}</a></div>`
    : "";
  const card = t.card
    ? `<div data-testid="card.wrapper"><div data-testid="card.layoutSmall.detail"><a href="https://t.co/lien" role="link"><div><span>exemple.fr</span></div><div><span>${t.card.title}</span></div></a></div></div>`
    : "";
  const q = t.quote;
  const quote = q
    ? `<div role="link" tabindex="0"><div data-testid="User-Name"><div><span>${emojis(q.name ?? "Cité")}</span></div><div><span>@${q.h}</span><span>·</span><time datetime="2026-10-28T07:00:00.000Z">2 h</time></div></div>${q.text ? `<div data-testid="tweetText"><span>${q.text}</span></div>` : ""}${poll(q.poll)}</div>`
    : "";
  return `<div data-testid="cellInnerDiv" style="position:relative"><div><div>
<article aria-labelledby="id_${t.id}" role="article" tabindex="0" data-testid="tweet">
 <div><div>
  <div><div><div></div></div></div>
  ${context}
  <div>
   <div data-testid="Tweet-User-Avatar"><div data-testid="UserAvatar-Container-${t.h}"><a href="/${t.h}" role="link"><img src="data:," alt=""></a></div></div>
   <div>
    <div><div data-testid="User-Name"><div><a href="/${t.h}" role="link"><span>${emojis(t.name)}</span></a></div>
      <div><a href="/${t.h}" role="link" tabindex="-1"><span>@${t.h}</span></a><span>·</span><a href="/${t.h}/status/${t.id}" role="link"><time datetime="2026-10-28T08:00:00.000Z">1 h</time></a></div></div></div>
    ${reply}
    <div><div id="id_${t.id}" lang="fr" dir="auto" data-testid="tweetText"><span>${emojis(t.text)}</span></div></div>
    ${poll(t.poll)}
    ${card}
    ${quote}
    <div role="group" aria-label="${t.n} réponses"><button data-testid="reply"><span>${t.n}</span></button><button data-testid="retweet"></button><button data-testid="like"></button></div>
   </div>
  </div>
 </div></div>
</article></div></div></div>`;
}
/**
 * Ce que laisse une instance de Voyou que Firefox a tuée sans prévenir, avant
 * de réinjecter le script : son module flottant, et un voile, ici sur un
 * élément qui n'est pas un tweet.
 */
export const leftovers = `<div id="voyou-hud" data-count="99"></div><div id="stale" data-voyou-state="hidden" data-voyou-key="status:1"><div data-voyou-target aria-hidden>Ancien contenu</div><div class="voyou-overlay"><button class="voyou-btn" data-voyou-action="reveal">Afficher quand même</button></div></div>`;

/**
 * Comme React sur X, un écouteur délégué ouvre le post, le tweet cité ou la
 * carte de compte où l'on clique. Ici, un repère sur <html> (data-opened)
 * tient lieu de navigation, pour ne pas perdre la page pendant le test.
 */
export const OPENS = `for(const type of ['click','auxclick'])document.addEventListener(type,e=>{if(e.target instanceof Element&&e.target.closest('article,[role="link"],[data-testid="UserCell"]'))document.documentElement.dataset.opened=type;});`;

/**
 * @typedef {object} Notification « a aimé votre post », sous lequel X reprend ce post, ou « vous suit »
 * @property {string} h compte qui a aimé, ou qui suit
 * @property {string} name
 * @property {string} [post] post de l'utilisateur
 * @property {boolean} hide
 */
/** @param {Notification} n */
export const notificationHTML = (n) =>
  `<div data-testid="cellInnerDiv"><article role="article" tabindex="0" data-testid="notification"><div><div data-testid="UserAvatar-Container-${n.h}"><a href="/${n.h}" role="link"><img alt="" src="data:,"></a></div></div><div><span><a href="/${n.h}" role="link"><span>${n.name}</span></a></span><span>${n.post ? " a aimé votre post" : " vous suit"}</span></div>${n.post ? `<div dir="auto"><span>${n.post}</span></div>` : ""}</article></div>`;

/**
 * @typedef {object} PageOptions
 * @property {boolean} [dark] fond noir, comme le thème sombre de X
 * @property {string} [lang] langue de X (attribut lang de la page)
 * @property {string} [stale] restes d'une instance précédente, au début de <body>
 * @property {string} [cells] cellules déjà dans le fil au chargement (notifications)
 * @property {boolean} [menu] menu de X, avec le lien vers le profil de l'utilisateur
 * @property {string} [tabs] compte d'un profil visité : ses onglets au-dessus du fil
 */
/**
 * Le fil est dans la colonne principale ; la colonne de droite et #layers
 * (photos, fenêtres de réponse) sont à côté, comme sur X.
 * @param {Tweet[]} tweets
 * @param {string} title
 * @param {PageOptions} [options]
 */
export function page(
  tweets,
  title,
  { dark = false, lang = "fr", stale = "", cells = "", menu = true, tabs = "" } = {},
) {
  const header = menu
    ? `<header role="banner"><nav role="navigation" aria-label="Menu principal">
 <a href="/home" data-testid="AppTabBar_Home_Link" aria-label="Accueil">Accueil</a>
 <a href="/explore" aria-label="Explorer">Explorer</a>
 <a href="/notifications" data-testid="AppTabBar_Notifications_Link">Notifications</a>
 <a href="/i/grok" aria-label="Grok">Grok</a>
 <a href="/moncompte" data-testid="AppTabBar_Profile_Link" aria-label="Profil">Profil</a>
</nav>
<div data-testid="SideNav_AccountSwitcher_Button" aria-label="Comptes"><div data-testid="UserAvatar-Container-moncompte"></div><span>Moi</span><span>@moncompte</span></div>
</header>`
    : "";
  const profileTabs = tabs
    ? `<nav role="navigation" aria-label="Onglets du profil"><div role="tablist"><a href="/${tabs}" role="tab">Posts</a><a href="/${tabs}/with_replies" role="tab">Réponses</a><a href="/${tabs}/media" role="tab">Médias</a></div></nav>`
    : "";
  return `<!DOCTYPE html><html dir="ltr" lang="${lang}"><head><meta charset="utf-8"><title>${title}</title></head>
<body${dark ? ' style="background-color: rgb(0, 0, 0)"' : ""}>${stale}<div id="react-root"><div><div>
${header}
<main role="main"><div data-testid="primaryColumn">${profileTabs}<section role="region"><div aria-label="Fil d'actualités : Votre fil d'actualités d'accueil"><div id="tl">${cells}</div></div></section></div>
<div data-testid="sidebarColumn"><section aria-label="Suggestions"></section></div></main>
</div></div><div id="layers"></div></div>
<script>
${OPENS}
const T=${JSON.stringify(tweets)};
const H=${tweetHTML.toString()};
setTimeout(()=>{const tl=document.getElementById('tl');T.slice(0,2).forEach(t=>tl.insertAdjacentHTML('beforeend',H(t)));},300);
setTimeout(()=>{const tl=document.getElementById('tl');T.slice(2).forEach(t=>tl.insertAdjacentHTML('beforeend',H(t)));},900);
</script></body></html>`;
}
export const timeline = [
  { id: "1001", h: "randomguy1", name: "Random", text: "Ces sales arabes doivent rentrer chez eux", n: 3, hide: true },
  { id: "1002", h: "newsfr", name: "Actu", text: "Le match de ce soir commence à 21h.", n: 1, hide: false },
  { id: "1003", h: "troll_en", name: "Troll", text: "go back home you dirty arabs", n: 0, hide: true },
  { id: "1004", h: "friendly", name: "Ami", text: "Super conférence aujourd hui, merci à tous", n: 2, hide: false },
  { id: "1005", h: "hater99", name: "Hater", text: "bougnoule va", n: 0, hide: true },
];
export const thread = [
  {
    id: "2000",
    h: "moncompte",
    name: "Moi",
    text: "Nouvelle vidéo en ligne ce soir !",
    n: 12,
    hide: false,
  },
  {
    id: "2001",
    h: "hater99",
    name: "Hater",
    text: "rentre dans ton pays sale bougnoule",
    n: 0,
    replyTo: "moncompte",
    hide: true,
  },
  {
    id: "2002",
    h: "fan_1",
    name: "Fan",
    text: "Profite bien, hâte de voir les vidéos",
    n: 0,
    replyTo: "moncompte",
    hide: false,
  },
  { id: "2003", h: "troll_en", name: "Troll", text: "nobody cares nigger", n: 0, replyTo: "moncompte", hide: true },
  { id: "2004", h: "randomguy1", name: "Random", text: "sale noir", n: 0, replyTo: "moncompte", hide: true },
  { id: "2005", h: "user123", name: "U123", text: "n1gg3r", n: 0, replyTo: "moncompte", hide: true },
  { id: "2006", h: "user456", name: "U456", text: "🐒🐒", n: 0, replyTo: "moncompte", hide: true },
  {
    id: "2007",
    h: "user789",
    name: "U789",
    text: "On va au zoo voir les bébés 🐒🙈",
    n: 0,
    replyTo: "moncompte",
    hide: false,
  },
  {
    id: "2008",
    h: "user555",
    name: "U555",
    text: "putain de journée, rien ne marche",
    n: 0,
    hide: false,
    profanity: true,
  },
  {
    id: "2009",
    h: "user321",
    name: "U321",
    text: "Regardez ce que j'ai reçu, c'est honteux",
    n: 0,
    hide: false,
    quote: { h: "troll_q", text: "rentre dans ton pays sale arabe", hide: true },
  },
  { id: "2010", h: "troll_name", name: "Sale bougnoule", text: "Bonne journée à tous", n: 0, hide: true },
  // Un nom fait d'emojis singe n'est pas une réponse faite d'emojis singe.
  { id: "2011", h: "zoo_officiel", name: "🦍🦍", text: "Ouverture du nouvel enclos ce week-end !", n: 0, hide: false },
  { id: "2012", h: "troll_emoji", name: "sale 🐒", text: "Bonne soirée", n: 0, hide: true },
  // Sous un tweet masqué, le tweet cité n'a pas de voile à lui.
  {
    id: "2013",
    h: "troll_q2",
    name: "TQ2",
    text: "rentre dans ton pays sale bougnoule",
    n: 0,
    hide: true,
    quote: { h: "troll_q3", text: "Les sales arabes dehors", hide: true },
  },
  // Le post de l'utilisateur, cité par un autre, n'est jamais masqué.
  {
    id: "2014",
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
    id: "2015",
    h: "user852",
    name: "U852",
    text: "Je ne comprends pas cette réponse",
    n: 0,
    hide: false,
    quote: { h: "troll_n2", name: "Sale bougnoule", text: "Bonne journée à tous", hide: true },
  },
  // Une fois hater99 autorisé (réglages du test), le tweet qu'il cite reste
  // masqué ; son tweet, cité par un autre, ne l'est plus.
  {
    id: "2016",
    h: "hater99",
    name: "Hater",
    text: "Regardez ce que je reçois",
    n: 0,
    hide: false,
    quote: { h: "troll_q4", text: "sale bougnoule", hide: true },
  },
  {
    id: "2017",
    h: "user159",
    name: "U159",
    text: "Encore lui",
    n: 0,
    hide: false,
    quote: { h: "hater99", name: "Hater", text: "bougnoule va", hide: true },
  },
  // Un tweet sans texte (photo seule) qui cite : seul le tweet cité est masqué.
  {
    id: "2018",
    h: "ami_photo",
    name: "Ami photo",
    text: "",
    n: 0,
    hide: false,
    quote: { h: "troll_q5", text: "rentre dans ton pays sale arabe", hide: true },
  },
  // Les options d'un sondage sont lues avec sa question.
  {
    id: "2019",
    h: "sondeur1",
    name: "S1",
    text: "Votre avis ?",
    n: 0,
    hide: true,
    poll: ["Les arabes dehors", "Ça m'est égal"],
  },
  {
    id: "2020",
    h: "user951",
    name: "U951",
    text: "Vu ce sondage ce matin",
    n: 0,
    hide: false,
    quote: { h: "sondeur2", text: "", poll: ["Sales bougnoules", "Je ne sais pas"], hide: true },
  },
  {
    id: "2021",
    h: "sondeur3",
    name: "S3",
    text: "On mange quoi ce soir ?",
    n: 0,
    hide: false,
    poll: ["Pizza", "Couscous"],
  },
  // La carte d'un lien est masquée seule, avec ou sans texte autour.
  {
    id: "2022",
    h: "lecteur1",
    name: "L1",
    text: "Lisez ça",
    n: 0,
    hide: false,
    card: { title: "Ces sales arabes doivent rentrer chez eux", hide: true },
  },
  {
    id: "2023",
    h: "lecteur2",
    name: "L2",
    text: "",
    n: 0,
    hide: false,
    card: { title: "Les bougnoules dehors", hide: true },
  },
  {
    id: "2024",
    h: "lecteur3",
    name: "L3",
    text: "Bonne lecture",
    n: 0,
    hide: false,
    card: { title: "Recettes faciles pour la semaine", hide: false },
  },
  // Le nom du compte qui a reposté suffit, comme celui de l'auteur.
  {
    id: "2025",
    h: "user753",
    name: "U753",
    text: "Belle journée au parc",
    n: 0,
    hide: true,
    repostedBy: { h: "troll_rt", name: "Sale bougnoule" },
  },
];

/**
 * @typedef {{ h: string, name: string, bio: string, hide: boolean }} Cell carte de compte
 *
 * @typedef {object} Profile
 * @property {string} h compte de la page
 * @property {string} bio
 * @property {boolean} hideBio
 * @property {Cell[]} cells
 */

/** @param {Cell} c */
export const cellHTML = (c) =>
  `<div data-testid="UserCell"><a href="/${c.h}" role="link"><span>${c.name}</span></a><a href="/${c.h}" role="link"><span>@${c.h}</span></a><div dir="auto"><span>${c.bio}</span></div></div>`;

/** @type {Profile} */
export const profile = {
  h: "troll_bio",
  bio: "Les arabes dehors, la France aux Français",
  hideBio: true,
  cells: [
    { h: "cell_bad", name: "Cell", bio: "sale bougnoule et fier de l'être", hide: true },
    { h: "cell_good", name: "Cuisine", bio: "Recettes faciles du quotidien", hide: false },
  ],
};

/** @param {Profile} p */
export function profilePage(p) {
  const body = `<div data-testid="UserName"><span>Profil</span><span>@${p.h}</span></div><div data-testid="UserDescription"><span>${p.bio}</span></div><section aria-label="Suggestions">${p.cells.map(cellHTML).join("")}</section>`;
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>profil</title></head>
<body><div id="react-root"><main role="main"><div data-testid="primaryColumn" id="col"></div></main></div>
<script>${OPENS}setTimeout(()=>{document.getElementById('col').insertAdjacentHTML('beforeend', ${JSON.stringify(body)});},300);</script>
</body></html>`;
}
