# Contribuer à Voyou

Merci de vouloir aider. Voyou est un petit projet maintenu par une personne, les contributions de toutes tailles sont bienvenues : un message mal filtré signalé, une règle de détection, une correction quand X change son site.

## Signaler un problème

Ouvre une [issue](https://github.com/chedli77/voyou/issues/new/choose) et choisis le bon modèle : message masqué à tort, message haineux qui passe, bug, ou idée.

Les issues sont publiques. Ne colle jamais un vrai message haineux tel quel, ni un pseudo, ni un lien vers un tweet : le texte exact d'une réponse suffit à retrouver son auteur sur X. Reformule en gardant les mots qui comptent.

Une faille de sécurité se signale en privé, voir [SECURITY.md](SECURITY.md).

## Préparer son poste

Il faut Node 22 ou plus récent.

```bash
git clone https://github.com/chedli77/voyou.git
cd voyou
npm install
npx playwright install chromium   # une fois, pour les tests DOM
```

Pour essayer tes changements, charge le dossier `extension/` dans Chrome (`chrome://extensions`, mode développeur, « Charger l'extension non empaquetée »). Après chaque modification, lance `npm run build`, recharge l'extension puis l'onglet x.com.

## Proposer un changement

1. Pars de la branche `dev` et crée une branche pour ton changement.
2. Lance `npm run check` et `npm run test:dom` : tout doit passer.
3. Ouvre une pull request vers `dev`. `main` ne reçoit que des versions testées, et chaque merge sur `main` part en production ([docs/publication.md](docs/publication.md)).

Le modèle de pull request rappelle les vérifications. Les commits peuvent être en français ou en anglais.

## Règles du projet

Ces règles ne se négocient pas, elles sont la raison d'être de Voyou :

1. Rien ne quitte l'appareil. Pas de requête réseau, pas de statistiques, pas de texte envoyé à un serveur. Une future fonction qui aurait besoin du réseau (télécharger un modèle, par exemple) devra être optionnelle, expliquée, et n'envoyer aucun contenu.
2. Voyou ne publie, ne like, ne répond, ne bloque et ne signale rien à la place de l'utilisateur.
3. Aucune vraie donnée dans le dépôt : les cas de test sont inventés, les comptes sont factices (`@user123`).
4. Les faux positifs comptent autant que les ratés. Avant de toucher aux listes, lis [docs/detection.md](docs/detection.md), en particulier ce qui doit volontairement passer.

## Style

Le code est en JavaScript, typé par des commentaires JSDoc que TypeScript vérifie. Prettier formate tout (`npm run format`). Les commentaires et la documentation sont en français, courts, et disent pourquoi plutôt que quoi.

Tout ce qui touche au DOM de X est dans `extension/content/x-dom.js`. Quand X change son site, c'est presque toujours là qu'il faut corriger.

Les règles de détection sont rangées par langue dans `extension/detection/lists/`. Une règle sûre dans une langue peut être un mot courant dans une autre : chaque ajout vient avec un cas de test qui doit passer, dans la même langue et dans les autres.

## Code de conduite

En participant, tu acceptes le [code de conduite](CODE_OF_CONDUCT.md).
