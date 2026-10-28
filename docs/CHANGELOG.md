# Historique des versions

## 0.3.0

Réglages, dans la popup :

1. Cinq filtres à activer ou couper : racisme, autres haines (religion, LGBT, handicap, sexisme), menaces, insultes, vulgarité. Les quatre premiers sont activés par défaut, la vulgarité est coupée.
2. Sensibilité souple, équilibrée ou stricte.
3. Comptes autorisés : leurs posts ne sont jamais masqués.
4. Le motif du masquage (« Racisme », « Menaces »…) s'affiche sous « Afficher quand même ».
5. Mots à masquer : toujours masqués, pluriel et déguisements compris.
6. Statistiques des 7 derniers jours par catégorie, sans aucun texte ni compte.
7. Interface en français, anglais, espagnol et portugais, dans la langue choisie dans X (pas celle du navigateur), et thème sombre.
8. Les réglages s'ouvrent d'un clic sur le module flottant de X, qui s'agrandit en panneau (et se réduit d'un clic, avec Échap ou en cliquant à côté). Le même panneau est dans la popup de la barre d'outils. Il vit dans un Shadow DOM fermé : les styles de X ne le cassent pas et le JavaScript de X ne peut pas lire les réglages affichés.

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
5. Paquets Edge et Firefox joints à chaque release, validés avec `web-ext lint`.
6. Politique de confidentialité en ligne, en français et en anglais.
7. Cas de test et pages factices avec des textes inventés uniquement.

## 0.2.1

1. Prise en charge du nouveau client web de X, sans `data-testid`.
2. Les réponses normales qui contiennent « votre post » ne sont plus ignorées par erreur.
3. 13 nouvelles règles : insultes françaises, déshumanisation, violence, homophobie, bases en allemand et en espagnol.
