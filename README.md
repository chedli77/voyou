# Voyou

[![CI](https://github.com/chedli77/voyou/actions/workflows/ci.yml/badge.svg)](https://github.com/chedli77/voyou/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/chedli77/voyou/badge)](https://scorecard.dev/viewer/?uri=github.com/chedli77/voyou)
[![Licence MIT](https://img.shields.io/badge/licence-MIT-blue)](LICENSE)

Voyou est une extension Chrome qui floute la haine sur X pendant que tu scrolles. Insultes racistes, « retourne dans ton pays », menaces, singes en emoji : le tweet est flouté avant que tu aies le temps de le lire. Un bouton « Afficher quand même » le révèle si tu veux le voir.

Tout se passe sur ton ordinateur. Pas de serveur, pas de compte, rien n'est envoyé nulle part. Voyou ne signale, ne bloque et ne publie rien à ta place : c'est un filtre pour tes yeux, pas un outil de modération.

Voyou est pensé pour celles et ceux qui reçoivent des vagues de réponses racistes sous leurs posts et veulent continuer à utiliser X. Le projet est jeune (version 0.3) mais utilisé tous les jours.

## Installer

La fiche du Chrome Web Store est en cours de validation par Google. En attendant, installe Voyou depuis la dernière [release](https://github.com/chedli77/voyou/releases/latest) :

1. Télécharge `voyou-<version>-chrome.zip` et décompresse-le.
2. Ouvre `chrome://extensions` et active le mode développeur.
3. Clique sur « Charger l'extension non empaquetée » et choisis le dossier décompressé.
4. Recharge tes onglets x.com.

Ça marche aussi dans les navigateurs basés sur Chromium, comme Dia, Brave ou Edge (le zip Edge a le même contenu). Une extension chargée ainsi ne se met pas à jour toute seule : refais ces étapes à chaque nouvelle version.

Firefox n'installe durablement que des modules signés par Mozilla. Le zip Firefox de la release sert à l'envoi sur addons.mozilla.org ; pour essayer Voyou d'ici là, charge-le depuis `about:debugging` (« Ce Firefox », « Charger un module complémentaire temporaire ») : il reste installé jusqu'au redémarrage de Firefox.

Pour essayer la version en cours de développement, clone le dépôt (`git clone https://github.com/chedli77/voyou.git`) et charge le dossier `extension/` de la même façon.

Sur X, un petit module en bas à droite affiche combien de messages sont masqués. Tu le déplaces en le faisant glisser. Un clic dessus l'agrandit en panneau de réglages : ce qu'il faut masquer, la sensibilité, tes propres mots à masquer, les comptes à ne jamais masquer, et les infos de la page et des 7 derniers jours. On le réduit d'un clic, avec Échap ou en cliquant à côté. Le même panneau s'ouvre depuis l'icône Voyou de la barre d'outils. L'interface parle la langue que tu as choisie dans X (français, anglais, espagnol ou portugais, l'anglais pour les autres) et suit son thème clair ou sombre.

## Ce qu'on peut masquer

| Filtre        | Exemples                                                       | Par défaut |
| ------------- | -------------------------------------------------------------- | ---------- |
| Racisme       | insultes racistes, « retourne dans ton pays », singes en emoji | activé     |
| Autres haines | religion, homophobie, transphobie, handicap, sexisme           | activé     |
| Menaces       | menaces de mort, appels à la violence                          | activé     |
| Insultes      | insultes adressées à quelqu'un                                 | activé     |
| Vulgarité     | jurons seuls, même sans cible                                  | coupé      |

Voyou filtre les tweets, les tweets cités (seul le tweet cité est flouté s'il est le seul en cause), les sondages, les cartes de lien, les noms d'affichage, les bios, les cartes de compte (suggestions, abonnés, recherche) et le titre de l'onglet. Il ne lit que du texte : ce qui est écrit dans une image ou une vidéo passe. Un élément masqué affiche le motif sous le bouton (« Racisme », « Menaces »), jamais son contenu. Une fois révélé, deux boutons de plus : « Ce n'est pas de la haine », qui désactive pour toi les règles en cause, et « Autoriser @compte ». Tes propres posts et ceux des comptes autorisés ne sont jamais masqués, mais un tweet haineux qu'ils citent l'est.

## Ce qui est détecté

Voyou s'appuie sur des règles écrites à la main, une liste par langue : des mots (insultes, termes racistes) et des tournures (renvois vers « ton pays », déshumanisation, menaces, insultes adressées). Il reconnaît aussi les déguisements courants : chiffres à la place des lettres (`4brut1`), lettres espacées (`a b r u t i`) ou stylisées (`𝐚𝐛𝐫𝐮𝐭𝐢`).

Langues : français, anglais, espagnol, portugais, italien, allemand et arabe (écriture arabe et arabizi). Les sous-entendus, le sarcasme et les codes passent encore. Le détail des règles, et de ce qui doit volontairement passer (« qué mono », « carro preto », « chink in the armor »), est dans [docs/detection.md](docs/detection.md).

## Vie privée

En plus de l'accès à x.com et twitter.com, pour lire les messages affichés, la seule permission est le stockage local (`storage`). Voyou y garde, dans ton navigateur seulement :

- tes réglages : Voyou activé ou coupé, filtres, sensibilité, mots à masquer, comptes autorisés, règles ignorées ;
- les comptes X détectés comme étant les tiens, pour ne jamais masquer tes propres posts ;
- la langue de l'interface de X, pour afficher la popup dans la même langue ;
- des compteurs de messages masqués par jour et par catégorie, sans aucun texte ni compte. Ceux de plus de 30 jours sont effacés à chaque mise à jour des compteurs et à l'ouverture de X ;
- la position du module flottant.

Aucune requête réseau, aucun texte de tweet enregistré. La politique de confidentialité est [en ligne](https://chedli77.github.io/voyou/confidentialite/).

## Développer

Il faut Node 22 ou plus récent.

```bash
npm install
npm run check        # formatage, types, version, images, tests unitaires, tests et robustesse du détecteur, bundles à jour
npm run build        # reconstruit les bundles de la page et de la popup
npm run score -- "texte à tester"
npm run test:unit    # tests unitaires du moteur, des réglages et des compteurs
npm run test:dom     # teste l'extension dans Chromium (npx playwright install chromium la première fois)
npm run package      # crée les zips Chrome, Edge et Firefox dans dist/
npm run screenshots  # refait les captures des fiches dans dist/screenshots/
```

Le code est en JavaScript, typé avec des commentaires JSDoc et vérifié par TypeScript (`npm run typecheck`). Les bundles sont commités pour que le dossier `extension/` se charge dans Chrome sans rien installer : pense à lancer `npm run build` avant de commiter.

On travaille sur `dev`, on teste, puis un merge sur `main` publie la version : release GitHub et envoi au Chrome Web Store. Le cycle est décrit dans [docs/publication.md](docs/publication.md).

```
extension/            l'extension telle qu'elle est publiée
  content/            script injecté dans X (main.js, x-dom.js, treat.js, hud.js, own-handles.js)
  detection/          le détecteur : score.js, normalize.js, categories.js, une liste JSON par langue
  ui/                 le panneau de réglages, partagé par le module flottant et la popup
  popup/              la popup de la barre d'outils
  _locales/           textes de l'interface (fr, en, es, pt)
  settings.js         lecture et validation des réglages, partagées par la popup et la page
  stats.js            compteurs locaux de messages masqués
tests/detection/      cas de test du détecteur (un fichier par langue), évaluation et tests de robustesse
tests/dom/            pages X factices pour tester l'extension dans Chromium
tests/unit/           tests unitaires (node --test) du détecteur, des réglages, des compteurs et des langues
scripts/              build, packaging, publication, captures des fiches, vérification des images, test d'un texte en ligne de commande
docs/                 détection, publication, historique des versions
design/voyou/         logos, icônes et leurs sources SVG, image de partage, textes des fiches des boutiques
```

## Contribuer

Les signalements sont aussi utiles que le code : un message masqué à tort ou une insulte qui passe, ça s'ouvre en [issue](https://github.com/chedli77/voyou/issues/new/choose) en deux minutes. Pour le code, tout est dans [CONTRIBUTING.md](CONTRIBUTING.md). Le projet suit un [code de conduite](CODE_OF_CONDUCT.md), et les failles de sécurité se signalent en privé ([SECURITY.md](SECURITY.md)).

## In English

Voyou is a Chrome extension that blurs racist and hateful posts on X while you scroll, entirely on your device: no server, no account, no data sent anywhere. It never reports or blocks anyone. You choose what to hide: racism, other hate, threats, insults, profanity. Rules cover French, English, Spanish, Portuguese, Italian, German and Arabic, and the interface is available in English, Spanish and Portuguese. The Chrome Web Store listing is under review: meanwhile, unzip the Chrome zip of the [latest release](https://github.com/chedli77/voyou/releases/latest) and load it as an unpacked extension. Issues and pull requests in English are welcome.

## Licence

MIT, voir [LICENSE](LICENSE).
