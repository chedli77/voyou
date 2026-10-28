# Détection

Le détecteur est une seule fonction, `scoreText({ text, lang, sensitivity })` dans `extension/detection/score.js`. Elle est pure et synchrone, ne fait aucune requête réseau, et sert à la fois à l'extension et aux tests.

## Comment un texte est noté

Deux listes, dans `extension/detection/lists/` :

`blocklist.json` contient des mots ou expressions (`bougnoule`, `sale arabe`). Ils doivent apparaître comme mots entiers, en ignorant la casse. Une expression en plusieurs mots est aussi reconnue collée (`salearabe`).

`patterns.json` contient des expressions régulières pour les tournures : renvois (« retourne dans ton pays »), déshumanisation, menaces, insultes adressées, emojis singe.

Chaque entrée a un poids entre 0 et 1. Les poids des entrées trouvées s'additionnent, plafonnés à 1. Avec la sensibilité moyenne, utilisée par l'extension, un score de 0,5 floute et un score de 0,75 « replie ». Dans l'interface les deux donnent aujourd'hui le même flou.

| Sensibilité | Flou à partir de | Repli à partir de |
| ----------- | ---------------- | ----------------- |
| low         | 0,70             | 0,90              |
| medium      | 0,50             | 0,75              |
| high        | 0,35             | 0,60              |

Quelques mots ambigus portent `requireAttackCompanion` : ils ne comptent que si une autre entrée a aussi été trouvée dans le texte. C'est le cas de `nègre` (sens littéraire ou historique) et de `raton` (raton laveur).

## Textes déguisés

`normalize.js` fabrique des variantes du texte, et les deux listes sont testées sur chacune. Le texte d'origine est toujours testé aussi, donc la normalisation ne peut qu'ajouter des correspondances.

Elle ramène les lettres stylisées à l'alphabet normal (𝐬𝐚𝐥𝐞, ｎｉｇｇｅｒ) et retire les caractères invisibles. Elle remplace les lettres cyrilliques ou grecques glissées dans un mot latin, et recolle les lettres espacées (`n.i.g.g.e.r`, `s a l e`). Elle traduit le leetspeak dans les mots d'au moins deux lettres (`n1gg3r`) et réduit les lettres étirées (`niiiigger`, `connnnard`).

Les accents ne sont jamais retirés. Les lettres doublées ne sont jamais réduites, pour que « Niger » reste « Niger ».

Un mot de 5 lettres ou plus dont certaines lettres sont remplacées par `*` ou `#` est reconnu, à condition que la première lettre soit visible et qu'au plus une lettre sur trois soit masquée. Il compte pour 60 % de son poids : il est flouté, jamais replié. Un mot presque entièrement masqué (`n*****`), fréquent quand quelqu'un dénonce une insulte reçue, passe.

## Ce qui doit passer

Le pire défaut d'un filtre comme celui là, c'est de masquer des messages normaux. Ces cas doivent rester visibles, et des tests le vérifient :

1. Le débat, même vif, sans insulte : critiquer une politique migratoire n'est pas de la haine.
2. Les jurons seuls (`putain`, `merde`) et l'argot du jeu vidéo (`noob`, `ez`, `n00b`).
3. Une personne qui parle d'elle même avec un mot qu'elle se réapproprie.
4. Le sens littéraire de `nègre` et l'animal `raton`, sans autre signal d'attaque.
5. Les titres de presse (« le voyou a été arrêté », « ont été exécutés »).
6. Les emojis 🙈🙉🙊, et les singes dans un contexte animalier sans personne visée.

Quelqu'un qui cite une insulte pour la dénoncer peut encore être flouté. Le bouton « Afficher quand même » reste la porte de sortie.

Faux positif connu : `pat-fr-singe-people` floute « il adore les singes ». Le resserrer risquerait de laisser passer « les singes dehors ».

## D'où viennent les règles

Elles ont été écrites à partir de vraies réponses haineuses reçues sur X. Ces réponses ne sont pas publiées et ne le seront jamais : même sans pseudo, le texte d'une réponse permet de retrouver son auteur en cherchant sur X. Les cas de test reprennent les mêmes tournures avec des textes inventés.

## Ajouter ou modifier une règle

1. Modifie l'entrée dans `blocklist.json` ou `patterns.json`, avec une `note` qui dit ce qu'elle attrape.
2. Ajoute dans `tests/detection/seed.json` au moins un cas qui doit être masqué et un cas proche qui doit passer. Les textes sont inventés et les comptes factices (`@user123`) : aucun vrai message, aucun vrai pseudo.
3. Lance `npm run eval`. Il doit afficher 0 faux positif et 0 raté.
4. Monte la version dans `extension/manifest.json` et `package.json`, et note le changement dans `docs/CHANGELOG.md`.

Pour tester un texte à la volée : `npm run score -- "texte"`. Le champ `reasonLocal` dit quelles entrées ont joué, avec `~norm` (trouvée sur une variante normalisée), `~glued` (expression collée) ou `~masked` (lettres masquées).
