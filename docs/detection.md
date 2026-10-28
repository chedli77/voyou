# Détection

Le détecteur est une seule fonction, `scoreText({ text, lang, sensitivity, categories })` dans `extension/detection/score.js`. Elle est pure et synchrone, ne fait aucune requête réseau, et sert à la fois à l'extension et aux tests.

## Les listes

Une liste par langue dans `extension/detection/lists/` : `fr.json`, `en.json`, `es.json`, `pt.json`, `de.json`, plus `multi.json` pour ce qui ne dépend pas de la langue (emojis, insultes homophobes communes à plusieurs langues). Ajouter une langue revient à ajouter un fichier et à l'importer dans `score.js`.

Chaque fichier contient deux tableaux :

`terms` : des mots ou expressions (`bougnoule`, `sale arabe`, `sudaca`). Ils doivent apparaître comme mots entiers, en ignorant la casse. Une expression en plusieurs mots est aussi reconnue collée (`salearabe`).

`patterns` : des expressions régulières pour les tournures. Par exemple les renvois (« vuelve a tu país »), la déshumanisation, les menaces, les insultes adressées ou les emojis singe.

Toutes les listes sont testées sur chaque texte, quelle que soit sa langue : un message mêle souvent deux langues, et la langue déclarée par X n'est pas fiable. Un mot d'une langue ne doit donc jamais être un mot courant d'une autre (`negro` est la couleur noire en espagnol, `fag` une cigarette au Royaume-Uni).

## Les filtres

Chaque règle appartient à une catégorie, que l'utilisateur active ou coupe dans la popup (`extension/detection/categories.js`) :

| Catégorie   | Contenu                                              | Par défaut |
| ----------- | ---------------------------------------------------- | ---------- |
| `racism`    | insultes racistes, renvois, xénophobie               | activé     |
| `hate`      | religion, homophobie, transphobie, handicap, sexisme | activé     |
| `threat`    | menaces de mort, appels à la violence                | activé     |
| `insult`    | insultes adressées                                   | activé     |
| `profanity` | jurons seuls                                         | coupé      |

Seules les règles des catégories activées comptent dans le score. Le motif affiché sous « Afficher quand même » est la catégorie qui pèse le plus.

## Le score

Chaque règle a un poids entre 0 et 1. Les poids des règles trouvées s'additionnent, plafonnés à 1, puis la sensibilité choisie dans la popup décide :

| Sensibilité          | Flou à partir de | Repli à partir de |
| -------------------- | ---------------- | ----------------- |
| `low` (souple)       | 0,70             | 0,90              |
| `medium` (équilibré) | 0,50             | 0,75              |
| `high` (strict)      | 0,35             | 0,60              |

L'interface traite aujourd'hui le flou et le repli de la même façon.

Quelques mots ambigus portent `requireAttackCompanion` : ils ne comptent que si une autre règle a aussi été trouvée dans le texte, même d'une catégorie coupée. C'est le cas de `nègre` (sens littéraire), de `raton` (raton laveur) et de `crioulo` (une langue).

## Textes déguisés

`normalize.js` fabrique des variantes du texte, et les listes sont testées sur chacune. Le texte d'origine est toujours testé aussi, donc la normalisation ne peut qu'ajouter des correspondances.

Elle ramène les lettres stylisées à l'alphabet normal (𝐬𝐚𝐥𝐞, ｎｉｇｇｅｒ) et retire les caractères invisibles. Elle remplace les lettres cyrilliques ou grecques glissées dans un mot latin, et recolle les lettres espacées (`n.i.g.g.e.r`, `s a l e`). Elle traduit le leetspeak dans les mots d'au moins deux lettres (`n1gg3r`) et réduit les lettres étirées (`niiiigger`, `connnnard`).

Les accents ne sont jamais retirés. Les lettres doublées ne sont jamais réduites, pour que « Niger » reste « Niger ».

Un mot de 5 lettres ou plus dont certaines lettres sont remplacées par `*` ou `#` est reconnu, à condition que la première lettre soit visible et qu'au plus une lettre sur trois soit masquée. Il compte pour 60 % de son poids : il est flouté, jamais replié. Un mot presque entièrement masqué (`n*****`), fréquent quand quelqu'un dénonce une insulte reçue, passe.

## Ce qui doit passer

Le pire défaut d'un filtre comme celui là, c'est de masquer des messages normaux. Ces cas doivent rester visibles, et des tests le vérifient dans chaque langue :

1. Le débat, même vif, sans insulte : critiquer une politique migratoire n'est pas de la haine.
2. Les jurons seuls, tant que le filtre vulgarité est coupé, et l'argot du jeu vidéo (`noob`, `ez`).
3. Une personne qui parle d'elle même, y compris avec autodérision (« quel imbécile je suis »).
4. Les mots à double sens : `raton` laveur, `mono` (mignon en espagnol), `macaco` au zoo, `preto` ou `negro` pour une couleur, `veado` (le cerf), `otária` (l'otarie).
5. Les expressions : « chink in the armor », « muérete de risa », « se mata de trabalhar », « taking out the trash ».
6. Les titres de presse (« le voyou a été arrêté », « le patient va mourir »).
7. Les emojis 🙈🙉🙊, et les singes dans un contexte animalier sans personne visée.

Quelqu'un qui cite une insulte pour la dénoncer peut encore être flouté. Le bouton « Afficher quand même » reste la porte de sortie.

## D'où viennent les règles

Elles ont été écrites à partir de vraies réponses haineuses reçues sur X, et complétées pour l'anglais, l'espagnol et le portugais. Ces réponses ne sont pas publiées et ne le seront jamais : même sans pseudo, le texte d'une réponse permet de retrouver son auteur en cherchant sur X. Les cas de test reprennent les mêmes tournures avec des textes inventés.

## Ajouter ou modifier une règle

1. Modifie l'entrée dans le fichier de la langue, avec sa catégorie et une `note` qui dit ce qu'elle attrape.
2. Ajoute dans `tests/detection/seed.json` au moins un cas qui doit être masqué et un cas proche qui doit passer. Les textes sont inventés et les comptes factices (`@user123`) : aucun vrai message, aucun vrai pseudo. Le champ `filters` permet de tester un cas avec d'autres filtres que ceux par défaut.
3. Lance `npm run eval`. Il doit afficher 0 faux positif et 0 raté.
4. Note le changement dans `docs/CHANGELOG.md`.

Pour tester un texte à la volée : `npm run score -- "texte"`. Le champ `reasonLocal` dit quelles règles ont joué, avec `~norm` (trouvée sur une variante normalisée), `~glued` (expression collée) ou `~masked` (lettres masquées).
