// Page qui imite le nouveau client « x-web » de X, relevé sur le vrai site :
// pas de data-testid, pas de #react-root, texte dans des div[dir=auto].
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
 */
/** @param {Tweet} t */
export function art(t) {
  const status = t.focused
    ? ""
    : `<a href="/${t.h}/status/${t.id}"><time datetime="2026-10-28T08:00:00.000Z">1 h</time></a>`;
  return `<div class="flex"><article class="flex flex-col"><div><div><div><div><div><a href="/${t.h}"><div><img alt="@${t.h}" src="data:,"></div></a></div></div>
<div><div><div><span><a href="/${t.h}"><div>${t.name}</div></a></span><span><a href="/${t.h}"><span>@${t.h}</span></a></span>${status}</div>
<div><button aria-label="Plus" type="button"></button></div></div></div></div>
<div dir="auto"><span>${t.text}</span></div>
<div><button aria-label="${t.n} réponses" type="button"><span>${t.n}</span></button></div></div></div></article></div>`;
}
/**
 * @param {Tweet[]} tweets
 * @param {string} title
 */
export function page(tweets, title) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title></head><body><div id="root">
<nav><a href="/home">Accueil</a><a href="/explore">Explorer</a><a href="/moncompte" aria-label="Profil">Profil</a></nav>
<main><div id="tl"></div></main></div>
<script>const T=${JSON.stringify(tweets)};const A=${art.toString()};
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
];
