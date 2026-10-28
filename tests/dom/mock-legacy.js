// Page minimale qui imite l'ancien DOM de X (avec data-testid). Les tweets sont
// insérés après le chargement, comme le fait l'application React de X, et les
// emojis sont des <img alt>, comme sur le vrai site.
// hide : ce que Voyou doit faire de chaque tweet.
/**
 * @typedef {object} Tweet
 * @property {string | number} id
 * @property {string} h compte de l'auteur
 * @property {string} name
 * @property {string} text
 * @property {number} n nombre de réponses
 * @property {boolean} hide
 * @property {string} [replyTo]
 * @property {boolean} [focused]
 * @property {boolean} [profanity] juron seul : masqué seulement avec le filtre vulgarité
 */
/** @param {Tweet} t */
export function tweetHTML(t) {
  const reply = t.replyTo
    ? `<div dir="ltr" class="r-ctx">En réponse à <a href="/${t.replyTo}" role="link">@${t.replyTo}</a></div>`
    : "";
  return `<div data-testid="cellInnerDiv" style="position:relative"><div><div>
<article aria-labelledby="id_${t.id}" role="article" tabindex="0" data-testid="tweet">
 <div><div>
  <div><div><div></div></div></div>
  <div>
   <div data-testid="Tweet-User-Avatar"><div data-testid="UserAvatar-Container-${t.h}"><a href="/${t.h}" role="link"><img src="data:," alt=""></a></div></div>
   <div>
    <div><div data-testid="User-Name"><div><a href="/${t.h}" role="link"><span>${t.name}</span></a></div>
      <div><a href="/${t.h}" role="link" tabindex="-1"><span>@${t.h}</span></a><span>·</span><a href="/${t.h}/status/${t.id}" role="link"><time datetime="2026-10-28T08:00:00.000Z">1 h</time></a></div></div></div>
    ${reply}
    <div><div lang="fr" dir="auto" data-testid="tweetText"><span>${t.text.replace(/\p{Extended_Pictographic}/gu, (/** @type {string} */ e) => `<img alt="${e}" src="data:,">`)}</span></div></div>
    <div role="group" aria-label="${t.n} réponses"><button data-testid="reply"><span>${t.n}</span></button><button data-testid="retweet"></button><button data-testid="like"></button></div>
   </div>
  </div>
 </div></div>
</article></div></div></div>`;
}
/**
 * @param {Tweet[]} tweets
 * @param {string} title
 */
export function page(tweets, title) {
  return `<!DOCTYPE html><html dir="ltr" lang="fr"><head><meta charset="utf-8"><title>${title}</title></head>
<body><div id="react-root"><div><div>
<header role="banner"><nav role="navigation" aria-label="Menu principal">
 <a href="/home" data-testid="AppTabBar_Home_Link" aria-label="Accueil">Accueil</a>
 <a href="/explore" aria-label="Explorer">Explorer</a>
 <a href="/notifications" data-testid="AppTabBar_Notifications_Link">Notifications</a>
 <a href="/i/grok" aria-label="Grok">Grok</a>
 <a href="/moncompte" data-testid="AppTabBar_Profile_Link" aria-label="Profil">Profil</a>
</nav>
<div data-testid="SideNav_AccountSwitcher_Button" aria-label="Comptes"><div data-testid="UserAvatar-Container-moncompte"></div><span>Moi</span><span>@moncompte</span></div>
</header>
<main role="main"><div data-testid="primaryColumn"><section role="region"><div aria-label="Fil d'actualités : Votre fil d'actualités d'accueil"><div id="tl"></div></div></section></div></main>
</div></div></div>
<script>
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
];
