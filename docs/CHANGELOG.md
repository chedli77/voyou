# Historique des versions

## 0.4.0

Sur X :

1. Ce que X ajoute ou réécrit après coup est flouté avant de s'afficher, partout dans la page : dans un tweet déjà affiché, dans la visionneuse de photos, dans les fenêtres de réponse et de citation, dans la colonne de droite. Avant, il pouvait rester lisible jusqu'à 3 secondes.
2. Au repos, Voyou ne réécrit plus rien dans la page (une boucle relançait les passes sans fin à cause du libellé « Autoriser »).
3. Un tweet cité est flouté dès que son tweet est affiché avec « Afficher quand même ». Un tweet cité révélé a sa barre « Masquer », « Ce n'est pas de la haine », « Autoriser ».
4. Un clic sur le voile ou sur le fond de la barre n'ouvre plus le post ni le profil masqué.
5. Le contenu masqué est vraiment caché aux lecteurs d'écran et au clavier (`inert`). En 0.3.0, l'attribut posé était vide et ne cachait rien.
6. Les touches tapées dans le panneau du module flottant ne remontent plus jusqu'à X : taper un mot dans « Mots à masquer » ne déclenche plus ses raccourcis (aimer, reposter, nouveau post).
7. Clavier : le focus entre dans le panneau à l'ouverture, Tab reste dans le panneau, Échap tapé ailleurs dans X ne le ferme plus, et « Afficher quand même » laisse le focus sur le post. L'anneau de focus des tweets traités est de retour.
8. Le panneau reste dans l'écran sur une petite fenêtre ou avec un zoom fort, et sa barre de défilement suit le thème sombre.
9. « Sur cette page » compte ce qui est masqué sur la page en cours, pas depuis l'ouverture de l'onglet.
10. Changer la langue de X ne montre plus une image avec les tweets masqués en clair, ni deux panneaux empilés.
11. Autoriser un compte ne refait plus tous les voiles et ne fait plus baisser le compteur.
12. Seuls de vrais clics de l'utilisateur peuvent utiliser « Ce n'est pas de la haine » et « Autoriser » : la page ne peut plus changer les réglages avec des clics fabriqués.
13. Chrome et Edge : après une mise à jour, les onglets X ouverts continuent de flouter avec les derniers réglages jusqu'au rechargement ; le module disparaît et les actions qui écrivent les réglages ne sont plus proposées. Cela corrige la note 6 de la 0.3.0 : le script ne s'arrête pas, il reste prudent.
14. Firefox : plus de second module figé après une mise à jour, et plus aucun bouton mort sur les tweets une fois l'extension désactivée.
15. Le détecteur est préchauffé une regex à la fois pendant les temps morts : plus de tâche de 200 ms au chargement.
16. Page des notifications : une réponse est toujours notée, quoi qu'elle dise et dans toutes les langues. Une notification sur ton post note les noms des comptes qui l'ont aimé ou reposté.
17. Un tweet cité est jugé pour son propre auteur : ton post cité par un autre n'est jamais flouté, et un tweet cité haineux reste flouté même dans le tweet d'un compte autorisé. « Autoriser » sous un tweet cité vaut pour ce compte partout.
18. Les options des sondages sont lues. Les cartes de lien sont floutées à part (ancien X). Les posts longs sont lus en entier, par tranches.
19. Les noms des auteurs cités et du compte qui a reposté sont filtrés ; un nom fait seulement d'emojis singe ne masque plus un compte.
20. Le titre de l'onglet ne montre plus un post ou un nom masqué.
21. Le compte connecté n'est plus deviné à partir des onglets d'un profil visité.

Réglages :

1. Deux filtres changés d'affilée sont bien enregistrés tous les deux, et un panneau ouvert ailleurs (popup ou module) suit les changements.
2. Un champ n'est plus réécrit pendant la saisie, et la dernière saisie est gardée même si la popup se ferme aussitôt.
3. Plus aucun texte en dur en français : règles ignorées et pluriels traduits (« 0 ocultos » en espagnol).
4. Statistiques : écritures regroupées sans être repoussées sans fin, aucun compte perdu quand plusieurs onglets X écrivent en même temps, jours justes aux changements d'heure, purge au-delà de 30 jours à l'ouverture de X.
5. Un mot perso collé dans une forme Unicode décomposée est reconnu. L'aide précise les limites et les pluriels pris (-s, -es, -x).
6. Firefox : si l'accès à x.com n'est pas accordé, la popup le dit et propose de l'accorder. L'accès à x.com et twitter.com est déclaré dans `host_permissions`.
7. La popup n'embarque plus le détecteur, seulement les notes des règles.

Détection :

1. L'apostrophe typographique (’) est reconnue partout, dans les listes comme dans les mots perso.
2. Une expression en plusieurs mots accepte espaces, tirets et soulignés entre ses mots.
3. Texte barré ou souligné avec des accents combinants, et caractères invisibles de toute sorte : retirés avant la lecture.
4. Arabe : أ إ آ ٱ, ى et ک sont unifiés, et les exclusions tiennent même quand le texte écrit une hamza ou une voyelle.
5. Un juron ou une règle ignorée ne réveille plus un mot ambigu (« nègre », « crioulo ») : il faut une vraie attaque à côté.
6. Un mot perso masqué (« m*t ») garde tout son poids.
7. Un nom d'affichage n'est pas jugé par les motifs qui ne valent que pour un message entier (un nom fait d'un emoji singe).
8. « killing them all », « shooting them all » et « they should all be killed » sont masqués ; les décorations du sapin passent.
9. Toutes les listes ont été revues langue par langue : moins de faux positifs (« te voy a buscar », « ti vengo a prendere », « sie geht zurück in ihr Heimatland », « Le train a 20 minutes de retard », la marque Banania, « violon », « exécuter les requêtes SQL »), féminins et graphies sans accent reconnus, menaces et renvois mieux ciblés.
10. Plusieurs motifs lents sur des textes piégés réécrits : aucun ne dépasse quelques millisecondes sur 4 000 caractères.

Code et tests :

1. Tests unitaires (`npm run test:unit`) pour le détecteur, la normalisation, les réglages, les statistiques et l'i18n.
2. `npm run eval` exige qu'un cas masqué déclenche chaque règle et vérifie le format des listes ; `npm run fuzz` chronomètre chaque motif sur des textes piégés.
3. Tests DOM plus stricts : vrai flou sous le voile, arbre d'accessibilité, page au repos, contenu tardif, cycle de vie, touches du panneau, clics sur le voile.
4. Les images du dépôt sont vérifiées sans métadonnées (`scripts/check-images.js`). Icônes redessinées en vectoriel, logos réencodés.
5. Vraies captures pour les boutiques, générées par `npm run screenshots` sur des pages factices avec des comptes inventés.
6. Release en deux temps : les dépendances npm tournent dans un job sans droits, la publication n'exécute aucun code de dépendance. Une relance après un échec du Store reprend le zip déjà attesté.
7. Corrections de la 0.3.0 : « validés avec web-ext lint » retiré ; la note 8 disait que X ne pouvait pas lire les réglages, c'était faux pendant la saisie (corrigé ici, point 6 de « Sur X »).

## 0.3.0

Réglages, dans la popup :

1. Cinq filtres à activer ou couper : racisme, autres haines (religion, LGBT, handicap, sexisme), menaces, insultes, vulgarité. Les quatre premiers sont activés par défaut, la vulgarité est coupée.
2. Sensibilité souple, équilibrée ou stricte.
3. Comptes autorisés : leurs posts ne sont jamais masqués.
4. Le motif du masquage (« Racisme », « Menaces »…) s'affiche sous « Afficher quand même ».
5. Mots à masquer : toujours masqués, pluriel et déguisements compris.
6. Statistiques des 7 derniers jours par catégorie, sans aucun texte ni compte.
7. Interface en français, anglais, espagnol et portugais, dans la langue choisie dans X (pas celle du navigateur), et thème sombre.
8. Les réglages s'ouvrent d'un clic sur le module flottant de X, qui s'agrandit en panneau (et se réduit d'un clic, avec Échap ou en cliquant à côté). Le même panneau est dans la popup de la barre d'outils. Il vit dans un Shadow DOM fermé, que les styles de X ne cassent pas.

Sur X :

1. Tweets cités : seul le tweet cité est flouté s'il est le seul en cause.
2. Noms d'affichage, bios de profil et cartes de compte (suggestions, abonnés, recherche) sont filtrés.
3. Sous un message révélé : « Ce n'est pas de la haine » désactive pour toi les règles en cause, « Autoriser @compte » l'ajoute aux comptes autorisés.
4. Le voile, la barre d'actions et le compteur suivent le thème sombre de X.
5. Le contenu masqué est caché aux lecteurs d'écran, et le voile se réduit au bouton sur les petits éléments.
6. Après une mise à jour ou un rechargement de l'extension, l'ancien script des onglets ouverts s'arrête proprement au lieu de remonter des erreurs « Extension context invalidated ».

Langues :

1. Espagnol, portugais, italien et arabe (écriture arabe et arabizi) : insultes racistes, renvois, comparaisons au singe, haine religieuse, homophobie, sexisme, menaces, insultes, jurons.
2. Allemand complété.
3. Anglais complété : insultes racistes, transphobie, validisme, sexisme, menaces, insultes fortes, jurons.
4. Français complété : menaces adressées, sexisme, handicap utilisé comme insulte, « sale » + religion.
5. Faux positifs corrigés : « negro » et « preto » pour la couleur, « les singes du parc », « chink in the armor », « taking out the trash », « the animals » au zoo, « quel imbécile je suis », « fag » (cigarette).

Détection :

1. Les textes déguisés sont reconnus : leetspeak, lettres espacées, lettres stylisées, caractères invisibles, sosies cyrilliques, lettres étirées, expressions collées.
2. Un mot masqué par `*` ou `#` est flouté, sans être replié.
3. Les emojis singe 🐒🦍🐵🦧 sont floutés quand la réponse ne contient qu'eux ou qu'ils visent quelqu'un. 🙈🙉🙊 ne comptent jamais.
4. Les expressions en plusieurs mots doivent maintenant être des mots entiers. « you apex predator », « dirty arabic food », « sales arabesques » et « sale noirci » ne sont plus floutés.
5. Sur X, les emojis sont des images : leur texte est maintenant lu, sinon les règles emoji ne voyaient rien.
6. Le compte connecté est aussi reconnu sur le nouveau client x-web : ses propres posts n'y sont plus floutés.
7. Les frontières de mot reconnaissent les lettres accentuées et l'arabe (« t'es attardé » était ignoré).
8. Les voyelles écrites de l'arabe et le tatweel, glissés pour déguiser un mot, sont retirés.
9. Plus rapide : une regex par règle au lieu d'une par mot, comparaison des mots masqués sans regex, et préchauffage du détecteur quand le navigateur est inactif. Un texte de 4 000 caractères est noté en environ 1 ms.

Code :

1. Un seul détecteur pour l'extension et les tests, au lieu de deux copies à garder synchronisées.
2. Content script réécrit : un tweet déjà noté n'est plus renoté à chaque passe, les comptes détectés ne sont écrits dans le stockage que s'ils changent, le rôle `article` des tweets de X n'est plus effacé, et le contenu masqué est caché aux lecteurs d'écran.
3. Code mort retiré (mode « réduire », interception de l'historique qui ne s'exécutait jamais, anciennes maquettes).
4. Commentaires en français, types vérifiés par TypeScript, formatage Prettier, CI GitHub.
5. Les tests DOM vérifient chaque tweet, les tweets cités, les bios, le thème sombre, la popup et ses actions.
6. Tests de robustesse : 3 000 textes aléatoires et piégés à chaque vérification (plantage, lenteur, déterminisme, déguisements).
7. La position du compteur flottant repart à sa place par défaut une fois (clés de stockage renommées).

Projet :

1. Projet ouvert : guide de contribution, code de conduite, politique de sécurité, modèles d'issues et de pull request.
2. CI durcie (permissions minimales, actions figées par empreinte), analyse CodeQL, OpenSSF Scorecard, Dependabot.
3. Mise en production au merge sur `main` : release GitHub avec le zip, puis envoi au Chrome Web Store sans aucun secret stocké (voir `docs/publication.md`).
4. L'extension ne demande plus que la permission `storage`.
5. Paquets Edge et Firefox joints à chaque release.
6. Politique de confidentialité en ligne, en français et en anglais.
7. Cas de test et pages factices avec des textes inventés uniquement.

## 0.2.1

1. Prise en charge du nouveau client web de X, sans `data-testid`.
2. Les réponses normales qui contiennent « votre post » ne sont plus ignorées par erreur.
3. 13 nouvelles règles : insultes françaises, déshumanisation, violence, homophobie, bases en allemand et en espagnol.
