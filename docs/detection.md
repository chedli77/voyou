# Détection

Le détecteur est une seule fonction, `scoreText({ text, sensitivity, categories, customTerms, mutedRules, scope })` dans `extension/detection/score.js`. Elle est pure et synchrone, ne fait aucune requête réseau, et sert à la fois à l'extension et aux tests.

## Les listes

Une liste par langue dans `extension/detection/lists/` : `fr.json`, `en.json`, `es.json`, `pt.json`, `it.json`, `de.json`, `ar.json`, plus `multi.json` pour ce qui ne dépend pas de la langue (emojis, insultes homophobes communes à plusieurs langues). Ajouter une langue revient à ajouter un fichier et à l'importer dans `score.js`.

Chaque fichier contient deux tableaux :

`terms` : des mots ou expressions (`bougnoule`, `sale arabe`, `sudaca`). Ils doivent apparaître comme mots entiers, en ignorant la casse. Entre les mots d'une expression, le texte peut mettre n'importe quelle suite de blancs, de tirets ou de `_` : `sale arabe` reconnaît aussi `sale  arabe`, un saut de ligne, `sale-arabe` et `#sale_arabe`. Une expression est aussi reconnue collée (`salearabe`). Un tiret entre deux mots compte comme un espace : `sous-homme` et `sous homme` sont la même expression.

`patterns` : des expressions régulières pour les tournures. Par exemple les renvois (« vuelve a tu país »), la déshumanisation, les menaces, les insultes adressées ou les emojis singe. En JavaScript, `\b` et `\w` ne connaissent que les lettres ASCII : `score.js` les remplace à la compilation par une frontière et une classe qui connaissent toutes les lettres, accents et arabe compris. Un `\b` placé juste avant un regard en arrière (`\b(?<!ele\s)vai`) se décide sur ce qui suit ce regard.

Le moteur ne peut pas sauter jusqu'au premier mot d'une alternative qui commence par un regard en arrière positif (`(?<=…)`) : il le teste à chaque position du texte, ce qui coûte cher sur un long tweet. `npm run eval` le refuse. Écris la forme négative (`(?<![\p{L}\p{N}][^\S\n]*)`, « aucun mot avant sur la même ligne ») ou mets le mot d'abord (`\bdu(?<!t\s+du)`). Derrière une ancre de début de ligne (`\n`, `[.!?]`), écris `[^\S\n]*` plutôt que `\s*` : `\s` contient aussi `\n`, et le motif relirait toute une suite de sauts de ligne à chaque position.

Un motif qui n'a de sens que pour un message entier, comme une réponse faite seulement d'emojis singe ou un « homo » lancé en fin de message, porte `wholeMessage`. Le nom d'affichage d'un compte est noté avec `scope: "name"`, qui ignore ces motifs : un compte qui s'appelle « 🐒 » ou « Marc, homo » n'est pas masqué, alors que « sale 🐒 » l'est.

Dans les mots comme dans les motifs, une apostrophe accepte aussi ses formes typographiques (`’`, `‘`, `ʼ`) : la ponctuation intelligente d'iOS écrit « I’ll » ou « qu’ils ». Écris l'apostrophe droite, dans une classe ou non.

En arabe, les graphies courantes sont ramenées à une seule, dans le texte comme dans les règles : l'alif avec hamza ou madda (`أ`, `إ`, `آ`, `ٱ`) se lit `ا`, `ى` se lit `ي` et le kaf persan `ک` se lit `ك`. Le `ی` persan reste distinct, car `یا` veut dire « ou » en persan. Le `ة` final et le `ه` restent distincts eux aussi : `ه` est aussi le pronom « son », et `كلبه` (« son chien ») n'est pas `كلبة` (« chienne »). Écris `[ةه]` dans un motif quand les deux graphies désignent le même mot. Un mot arabe peut porter un préfixe collé (`و`, `ف`, `ب`) : un motif qui vise un mot seul l'accepte avec `[وفب]?`.

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

Deux réglages de l'utilisateur s'ajoutent aux listes. Les **mots à masquer** (`customTerms`) sont toujours masqués, quelle que soit la sensibilité, déguisements compris. Les pluriels réguliers en -s, -es et -x sont ajoutés d'office ; un pluriel irrégulier (`chevaux`) s'écrit sur sa propre ligne. Ils suivent les mêmes règles que les mots des listes (expressions, apostrophes). Les **règles ignorées** (`mutedRules`) sont celles que l'utilisateur a désactivées avec « Ce n'est pas de la haine » ; elles ne comptent plus pour lui.

## Le score

Chaque règle a un poids entre 0 et 1. Les poids des règles trouvées s'additionnent, plafonnés à 1, puis la sensibilité choisie dans la popup décide :

| Sensibilité          | Flou à partir de | Repli à partir de |
| -------------------- | ---------------- | ----------------- |
| `low` (souple)       | 0,70             | 0,90              |
| `medium` (équilibré) | 0,50             | 0,75              |
| `high` (strict)      | 0,35             | 0,60              |

L'interface traite aujourd'hui le flou et le repli de la même façon.

Quelques mots ambigus portent `requireAttackCompanion` : ils ne comptent que si une autre règle a aussi été trouvée dans le texte, même d'une catégorie coupée. Un juron ne compte pas pour cela, ni un autre mot ambigu, ni une règle que l'utilisateur a ignorée. C'est le cas de `nègre` (sens littéraire), de `raton` (raton laveur) et de `crioulo` (une langue).

## Textes déguisés

`normalize.js` fabrique des variantes du texte, et les listes sont testées sur chacune. Le texte d'origine est toujours testé aussi, sans les voyelles écrites de l'arabe et avec ses graphies unifiées comme dans les règles, donc la normalisation ne peut qu'ajouter des correspondances.

Elle ramène les lettres stylisées à l'alphabet normal (𝐬𝐚𝐥𝐞, ｎｉｇｇｅｒ), retire les caractères invisibles (tous ceux que Unicode déclare invisibles), les traits du texte barré, souligné ou encerclé (s̶a̶l̶e̶), ainsi que les voyelles écrites et le tatweel de l'arabe. Elle recolle les lettres espacées (`n.i.g.g.e.r`, `s a l e`) puis remplace les lettres cyrilliques ou grecques glissées dans un mot latin, même espacées. Elle traduit le leetspeak dans les mots d'au moins deux lettres (`n1gg3r`) et réduit les lettres étirées à une (`niiiigger`) et à deux (`connnnard`).

Les accents ne sont jamais retirés. Les lettres doublées ne sont jamais réduites, pour que « Niger » reste « Niger ».

La réduction à deux lettres peut fabriquer un mot d'une autre langue : « cooon », le « con » étiré, deviendrait l'insulte anglaise « coon ». Une règle qui porte `strictDoubles` n'est pas testée sur cette variante : ses lettres doublées doivent être écrites telles quelles.

Un mot de 5 lettres ou plus dont certaines lettres sont remplacées par `*` ou `#` est reconnu, à condition que la première lettre soit visible et qu'au plus une lettre sur trois soit masquée ; une expression aussi, écrite collée (`k*somak`). Il compte pour 60 % du poids de sa règle : seul, il ne suffit jamais en sensibilité souple, et en équilibrée seulement pour les règles les plus lourdes (0,85 et plus). Un mot à masquer de l'utilisateur garde tout son poids. Un mot presque entièrement masqué (`n*****`), fréquent quand quelqu'un dénonce une insulte reçue, passe.

## Ce qui doit passer

Le pire défaut d'un filtre comme celui-là, c'est de masquer des messages normaux. Ces cas doivent rester visibles, et des tests le vérifient dans chaque langue :

1. Le débat, même vif, sans insulte : critiquer une politique migratoire n'est pas de la haine.
2. Les jurons seuls, tant que le filtre vulgarité est coupé, et l'argot du jeu vidéo (`noob`, `ez`).
3. Une personne qui parle d'elle-même, y compris avec autodérision (« quel imbécile je suis »).
4. Les mots à double sens : `raton` laveur, `mono` (mignon en espagnol), `macaco` au zoo, `preto` ou `negro` pour une couleur, `veado` (le cerf), `otária` (l'otarie).
5. Les expressions : « chink in the armor », « muérete de risa », « se mata de trabalhar », « taking out the trash ».
6. Les titres de presse (« le voyou a été arrêté », « le patient va mourir »).
7. Les emojis 🙈🙉🙊, et les singes dans un contexte animalier sans personne visée.

Quelqu'un qui cite une insulte pour la dénoncer peut encore être flouté. Le bouton « Afficher quand même » reste la porte de sortie.

## Ce que Voyou ne lit pas

Voyou lit le texte des tweets, les noms d'affichage, les bios et les cartes de compte. Il ne lit pas :

- le texte dessiné dans une image ou une vidéo ;
- le texte alternatif des médias ;
- les tendances ;
- la localisation et le site web d'un profil.

## D'où viennent les règles

Elles ont été écrites à partir de vraies réponses haineuses reçues sur X, et complétées pour l'anglais, l'espagnol et le portugais. Ces réponses ne sont pas publiées et ne le seront jamais : même sans pseudo, le texte d'une réponse permet de retrouver son auteur en cherchant sur X. Les cas de test reprennent les mêmes tournures avec des textes inventés.

## Ajouter ou modifier une règle

1. Modifie l'entrée dans le fichier de la langue, avec sa catégorie et une `note` qui dit ce qu'elle attrape. Son `id` ne contient que des minuscules, des chiffres et des tirets : c'est lui que « Ce n'est pas de la haine » enregistre.
2. Ajoute dans `tests/detection/cases/<langue>.json` au moins un cas qui doit être masqué et un cas proche qui doit passer. Les textes sont inventés et les comptes factices (`@user123`) : aucun vrai message, aucun vrai pseudo. Le champ `filters` permet de tester un cas avec d'autres filtres que ceux par défaut, `scope` (`"name"`) de le noter comme un nom d'affichage, et `expectRules` de vérifier quelles règles ont joué.
3. Lance `npm run eval`. Il doit afficher 0 faux positif, 0 raté et aucune règle sans cas masqué : chaque règle doit jouer dans au moins un cas qui doit être masqué, avec les filtres de ce cas. Chaque cas est passé à toutes les listes, comme dans l'extension : un mot ajouté en italien qui serait un mot courant en espagnol fait échouer un cas espagnol.
4. Lance `npm run fuzz` : aucun texte, même long ou piégé, ne doit planter le détecteur ni prendre plus de 150 ms. Chaque motif est aussi chronométré seul sur des textes de 4 000 caractères faits de ses propres mots répétés, collés ou espacés : un `\w*` ou un `[\s\S]{0,200}` sans ancre y devient vite quadratique. Il est aussi chronométré sur de longues suites de sauts de ligne et d'espaces, où il doit rester sous 3 ms.
5. Note le changement dans `docs/CHANGELOG.md`.

Si tu touches au moteur (`score.js`, `normalize.js`), lance aussi `npm run test:unit`.

Pour tester un texte à la volée : `npm run score -- "texte"`. Le champ `reasonLocal` dit quelles règles ont joué, avec `~norm` (trouvée sur une variante normalisée), `~glued` (expression collée) ou `~masked` (lettres masquées).
