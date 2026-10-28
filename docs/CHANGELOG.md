# Historique des versions

## 0.3.0

Réglages, dans la popup :

1. Cinq filtres à activer ou couper : racisme, autres haines (religion, LGBT, handicap, sexisme), menaces, insultes, vulgarité. Les quatre premiers sont activés par défaut, la vulgarité est coupée.
2. Sensibilité souple, équilibrée ou stricte.
3. Comptes autorisés : leurs posts ne sont jamais masqués.
4. Le motif du masquage (« Racisme », « Menaces »…) s'affiche sous « Afficher quand même ».

Langues :

1. Espagnol et portugais : insultes racistes, renvois, comparaisons au singe, homophobie, sexisme, menaces, insultes, jurons.
2. Anglais complété : insultes racistes, transphobie, validisme, sexisme, menaces, insultes fortes, jurons.
3. Français complété : menaces adressées, sexisme, handicap utilisé comme insulte, « sale » + religion.
4. Faux positifs corrigés : « negro » et « preto » pour la couleur, « les singes du parc », « chink in the armor », « taking out the trash », « the animals » au zoo, « quel imbécile je suis », « fag » (cigarette).

Détection :

1. Les textes déguisés sont reconnus : leetspeak, lettres espacées, lettres stylisées, caractères invisibles, sosies cyrilliques, lettres étirées, expressions collées.
2. Un mot masqué par `*` ou `#` est flouté, sans être replié.
3. Les emojis singe 🐒🦍🐵🦧 sont floutés quand la réponse ne contient qu'eux ou qu'ils visent quelqu'un. 🙈🙉🙊 ne comptent jamais.
4. Les expressions en plusieurs mots doivent maintenant être des mots entiers. « you apex predator », « dirty arabic food », « sales arabesques » et « sale noirci » ne sont plus floutés.
5. Sur X, les emojis sont des images : leur texte est maintenant lu, sinon les règles emoji ne voyaient rien.
6. Le compte connecté est aussi reconnu sur le nouveau client x-web : ses propres posts n'y sont plus floutés.

Code :

1. Un seul détecteur pour l'extension et les tests, au lieu de deux copies à garder synchronisées.
2. Content script réécrit : un tweet déjà noté n'est plus renoté à chaque passe, les comptes détectés ne sont écrits dans le stockage que s'ils changent, le rôle `article` des tweets de X n'est plus effacé, et le contenu masqué est caché aux lecteurs d'écran.
3. Code mort retiré (mode « réduire », interception de l'historique qui ne s'exécutait jamais, anciennes maquettes).
4. Commentaires en français, types vérifiés par TypeScript, formatage Prettier, CI GitHub.
5. Les tests DOM vérifient maintenant chaque tweet et le bouton « Afficher quand même ».
6. La position du compteur flottant repart à sa place par défaut une fois (clés de stockage renommées).

Projet :

1. Projet ouvert : guide de contribution, code de conduite, politique de sécurité, modèles d'issues et de pull request.
2. CI durcie (permissions minimales, actions figées par empreinte), analyse CodeQL, Dependabot.
3. Mise en production au merge sur `main` : release GitHub avec le zip, puis envoi au Chrome Web Store sans aucun secret stocké (voir `docs/publication.md`).
4. L'extension ne demande plus que la permission `storage`.
5. Cas de test et pages factices avec des textes inventés uniquement.

## 0.2.1

1. Prise en charge du nouveau client web de X, sans `data-testid`.
2. Les réponses normales qui contiennent « votre post » ne sont plus ignorées par erreur.
3. 13 nouvelles règles : insultes françaises, déshumanisation, violence, homophobie, bases en allemand et en espagnol.
