# Voyou

[![CI](https://github.com/chedli77/voyou/actions/workflows/ci.yml/badge.svg)](https://github.com/chedli77/voyou/actions/workflows/ci.yml)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/kmoeediamoohgahdjihebjnckpgdeege?label=Chrome%20Web%20Store)](https://chromewebstore.google.com/detail/voyou/kmoeediamoohgahdjihebjnckpgdeege)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/chedli77/voyou/badge)](https://scorecard.dev/viewer/?uri=github.com/chedli77/voyou)
[![Licence MIT](https://img.shields.io/badge/licence-MIT-blue)](LICENSE)

Voyou est une extension Chrome qui floute la haine sur X pendant que tu scrolles. Insultes racistes, « retourne dans ton pays », menaces, singes en emoji : le tweet est flouté avant que tu aies le temps de le lire. Un bouton « Afficher quand même » le révèle si tu veux le voir.

Tout se passe sur ton ordinateur. Pas de serveur, pas de compte, rien n'est envoyé nulle part. Voyou ne signale, ne bloque et ne publie rien à ta place : c'est un filtre pour tes yeux, pas un outil de modération.

Voyou est pensé pour celles et ceux qui reçoivent des vagues de réponses racistes sous leurs posts et veulent continuer à utiliser X. Le projet est jeune (version 0.3) mais utilisé tous les jours.

## Installer

Le plus simple : la [page Chrome Web Store](https://chromewebstore.google.com/detail/voyou/kmoeediamoohgahdjihebjnckpgdeege). Elle marche aussi dans les navigateurs basés sur Chromium, comme Dia, Brave ou Edge. Des paquets pour Edge et Firefox sont joints à chaque [release](https://github.com/chedli77/voyou/releases).

Pour essayer la version en cours de développement :

1. Clone le dépôt : `git clone https://github.com/chedli77/voyou.git`
2. Ouvre `chrome://extensions` et active le mode développeur.
3. Clique sur « Charger l'extension non empaquetée » et choisis le dossier `extension/`.
4. Recharge tes onglets x.com.

À l'installation, un écran d'accueil te fait choisir tes filtres. Ensuite, l'icône Voyou dans la barre d'outils ouvre les réglages : ce qu'il faut masquer, la sensibilité, tes propres mots à masquer, les comptes à ne jamais masquer, et les statistiques des 7 derniers jours. L'interface est en français, anglais, espagnol et portugais, et suit le thème clair ou sombre.

## Ce qu'on peut masquer

| Filtre        | Exemples                                                       | Par défaut |
| ------------- | -------------------------------------------------------------- | ---------- |
| Racisme       | insultes racistes, « retourne dans ton pays », singes en emoji | activé     |
| Autres haines | religion, homophobie, transphobie, handicap, sexisme           | activé     |
| Menaces       | menaces de mort, appels à la violence                          | activé     |
| Insultes      | insultes adressées à quelqu'un                                 | activé     |
| Vulgarité     | jurons seuls, même sans cible                                  | coupé      |

Voyou filtre les tweets, les tweets cités (seul le tweet cité est flouté s'il est le seul en cause), les noms d'affichage, les bios et les cartes de compte. Un élément masqué affiche le motif sous le bouton (« Racisme », « Menaces »), jamais son contenu. Une fois révélé, deux boutons de plus : « Ce n'est pas de la haine », qui désactive pour toi les règles en cause, et « Autoriser @compte ». Tes propres posts et ceux des comptes autorisés ne sont jamais masqués.

## Ce qui est détecté

Voyou s'appuie sur des règles écrites à la main, une liste par langue : des mots (insultes, termes racistes) et des tournures (renvois vers « ton pays », déshumanisation, menaces, insultes adressées). Il reconnaît aussi les déguisements courants comme `n1gg3r`, `s a l e`, `𝐬𝐚𝐥𝐞` ou `b*ugnoule`.

Langues : français, anglais, espagnol, portugais, italien, allemand et arabe (écriture arabe et arabizi). Les sous-entendus, le sarcasme et les codes passent encore. Le détail des règles, et de ce qui doit volontairement passer (« qué mono », « carro preto », « chink in the armor »), est dans [docs/detection.md](docs/detection.md).

## Vie privée

La seule permission demandée est `storage`. Voyou y garde tes réglages, les comptes X détectés comme étant les tiens, et la position du compteur. Aucune requête réseau, aucune statistique, aucun texte de tweet enregistré. Les statistiques ne sont que des compteurs par jour et par catégorie, sans texte ni compte. La politique de confidentialité est [en ligne](https://chedli77.github.io/voyou/confidentialite/).

## Développer

Il faut Node 22 ou plus récent.

```bash
npm install
npm run check        # formatage, types, version, tests et robustesse du détecteur, bundles à jour
npm run build        # reconstruit les bundles de la page et de la popup
npm run score -- "texte à tester"
npm run test:dom     # teste l'extension dans Chromium (npx playwright install chromium la première fois)
npm run package      # crée les zips Chrome, Edge et Firefox dans dist/
```

Le code est en JavaScript, typé avec des commentaires JSDoc et vérifié par TypeScript (`npm run typecheck`). Les bundles sont commités pour que le dossier `extension/` se charge dans Chrome sans rien installer : pense à lancer `npm run build` avant de commiter.

On travaille sur `dev`, on teste, puis un merge sur `main` publie la version : release GitHub et envoi au Chrome Web Store. Le cycle est décrit dans [docs/publication.md](docs/publication.md).

```
extension/            l'extension telle qu'elle est publiée
  content/            script injecté dans X (main.js, x-dom.js, treat.js, hud.js, own-handles.js)
  detection/          le détecteur : score.js, normalize.js, categories.js, une liste JSON par langue
  popup/              les réglages, dans la barre d'outils
  _locales/           textes de l'interface (fr, en, es, pt)
  settings.js         lecture et validation des réglages, partagées par la popup et la page
  stats.js            compteurs locaux de messages masqués
  background.js       ouvre l'écran d'accueil à l'installation
tests/detection/      cas de test du détecteur (un fichier par langue), évaluation et tests de robustesse
tests/dom/            pages X factices pour tester l'extension dans Chromium
scripts/              build, packaging, publication, test d'un texte en ligne de commande
docs/                 détection, publication, historique des versions
design/voyou/         icônes, captures et textes de la fiche Chrome Web Store
```

## Contribuer

Les signalements sont aussi utiles que le code : un message masqué à tort ou une insulte qui passe, ça s'ouvre en [issue](https://github.com/chedli77/voyou/issues/new/choose) en deux minutes. Pour le code, tout est dans [CONTRIBUTING.md](CONTRIBUTING.md). Le projet suit un [code de conduite](CODE_OF_CONDUCT.md), et les failles de sécurité se signalent en privé ([SECURITY.md](SECURITY.md)).

## In English

Voyou is a Chrome extension that blurs racist and hateful posts on X while you scroll, entirely on your device: no server, no account, no data sent anywhere. It never reports or blocks anyone. You choose what to hide: racism, other hate, threats, insults, profanity. Rules cover French, English, Spanish, Portuguese, Italian, German and Arabic, and the interface is available in English, Spanish and Portuguese. Issues and pull requests in English are welcome.

## Licence

MIT, voir [LICENSE](LICENSE).
