# Voyou

[![CI](https://github.com/chedli77/voyou/actions/workflows/ci.yml/badge.svg)](https://github.com/chedli77/voyou/actions/workflows/ci.yml)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/kmoeediamoohgahdjihebjnckpgdeege?label=Chrome%20Web%20Store)](https://chromewebstore.google.com/detail/voyou/kmoeediamoohgahdjihebjnckpgdeege)
[![Licence MIT](https://img.shields.io/badge/licence-MIT-blue)](LICENSE)

Voyou est une extension Chrome qui floute la haine sur X pendant que tu scrolles. Insultes racistes, « retourne dans ton pays », menaces, singes en emoji : le tweet est flouté avant que tu aies le temps de le lire. Un bouton « Afficher quand même » le révèle si tu veux le voir.

Tout se passe sur ton ordinateur. Pas de serveur, pas de compte, rien n'est envoyé nulle part. Voyou ne signale, ne bloque et ne publie rien à ta place : c'est un filtre pour tes yeux, pas un outil de modération.

Voyou est pensé pour celles et ceux qui reçoivent des vagues de réponses racistes sous leurs posts et veulent continuer à utiliser X. Le projet est jeune (version 0.2) mais utilisé tous les jours.

## Installer

Le plus simple : la [page Chrome Web Store](https://chromewebstore.google.com/detail/voyou/kmoeediamoohgahdjihebjnckpgdeege). Elle marche aussi dans les navigateurs basés sur Chromium, comme Dia, Brave ou Edge.

Pour essayer la version en cours de développement :

1. Clone le dépôt : `git clone https://github.com/chedli77/voyou.git`
2. Ouvre `chrome://extensions` et active le mode développeur.
3. Clique sur « Charger l'extension non empaquetée » et choisis le dossier `extension/`.
4. Recharge tes onglets x.com.

L'icône Voyou dans la barre d'outils permet de couper le filtre à tout moment.

## Ce qui est détecté

Voyou s'appuie sur des règles écrites à la main : une liste de mots (insultes, termes racistes) et des tournures (renvois vers « ton pays », déshumanisation, menaces, insultes adressées). Il reconnaît aussi les déguisements courants comme `n1gg3r`, `s a l e`, `𝐬𝐚𝐥𝐞` ou `b*ugnoule`.

Il vise surtout le français et l'anglais, avec un peu d'allemand et d'espagnol. Les sous-entendus, le sarcasme et les codes passent encore. Le détail des règles, et de ce qui doit volontairement passer, est dans [docs/detection.md](docs/detection.md).

Tes propres posts ne sont jamais floutés.

## Vie privée

La seule permission demandée est `storage`. Voyou y garde l'état activé ou non, les comptes X détectés comme étant les tiens, et la position du compteur. Aucune requête réseau, aucune statistique. La politique de confidentialité est dans [design/voyou/privacy/index.html](design/voyou/privacy/index.html).

## Développer

Il faut Node 22 ou plus récent.

```bash
npm install
npm run check        # formatage, types, tests du détecteur, bundle à jour
npm run build        # reconstruit extension/content/content.bundle.js
npm run score -- "texte à tester"
npm run test:dom     # teste l'extension dans Chromium (npx playwright install chromium la première fois)
npm run package      # crée dist/voyou-<version>-store.zip pour le Chrome Web Store
```

Le code est en JavaScript, typé avec des commentaires JSDoc et vérifié par TypeScript (`npm run typecheck`). Le bundle est commité pour que le dossier `extension/` se charge dans Chrome sans rien installer : pense à lancer `npm run build` avant de commiter.

```
extension/            l'extension telle qu'elle est publiée
  content/            script injecté dans X (main.js, x-dom.js, treat.js, hud.js, own-handles.js)
  detection/          le détecteur : score.js, normalize.js et les listes JSON
  popup/              la petite fenêtre de la barre d'outils
tests/detection/      cas de test du détecteur (seed.json) et leur évaluation
tests/dom/            pages X factices pour tester l'extension dans Chromium
scripts/              build, packaging, test d'un texte en ligne de commande
docs/                 règles de détection et historique des versions
design/voyou/         icônes, captures et textes de la fiche Chrome Web Store
```

## Contribuer

Les signalements sont aussi utiles que le code : un message masqué à tort ou une insulte qui passe, ça s'ouvre en [issue](https://github.com/chedli77/voyou/issues/new/choose) en deux minutes. Pour le code, tout est dans [CONTRIBUTING.md](CONTRIBUTING.md). Le projet suit un [code de conduite](CODE_OF_CONDUCT.md), et les failles de sécurité se signalent en privé ([SECURITY.md](SECURITY.md)).

## In English

Voyou is a Chrome extension that blurs racist and hateful posts on X while you scroll, entirely on your device: no server, no account, no data sent anywhere. It never reports or blocks anyone. Detection rules target French and English. Issues and pull requests in English are welcome.

## Licence

MIT, voir [LICENSE](LICENSE).
