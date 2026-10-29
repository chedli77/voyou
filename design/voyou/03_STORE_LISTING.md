# Fiche Chrome Web Store, Edge Add-ons et Firefox Add-ons

Textes à coller dans les tableaux de bord des boutiques. `scripts/publish-store.js` n'envoie que le paquet : la fiche se met à jour à la main (voir `docs/publication.md`).

Politique de confidentialité : https://chedli77.github.io/voyou/confidentialite/

## Nom

Voyou. C'est le champ `name` de `extension/manifest.json` : le Chrome Web Store et Edge l'affichent tel quel et n'ont pas de champ pour le changer. Seul addons.mozilla.org permet de le modifier dans la fiche.

## Description courte

Le Chrome Web Store et Edge la lisent dans le paquet : c'est le message `extDescription` de `extension/_locales/<langue>/messages.json`, 132 caractères au plus. Elle se modifie là et nulle part ailleurs. Sur addons.mozilla.org, colle le même texte dans le résumé.

Pour vérifier les longueurs :

```bash
node -e 'for (const l of ["fr", "en", "es", "pt"]) console.log(l, [...require(`./extension/_locales/${l}/messages.json`).extDescription.message].length)'
```

## Description détaillée

### FR

Voyou floute les messages haineux sur X avant que tu aies le temps de les lire : insultes racistes, « retourne dans ton pays », menaces, homophobie, sexisme, singes en emoji. Un bouton « Afficher quand même » les révèle si tu veux les voir.

Tu choisis ce qui est masqué : racisme, autres haines, menaces, insultes, et si tu veux, la vulgarité. Trois niveaux de sensibilité, tes propres mots à masquer, des comptes à ne jamais masquer. Les noms d'affichage, les bios et les tweets cités sont filtrés aussi.

Voyou reconnaît le français, l'anglais, l'espagnol, le portugais, l'italien, l'allemand et l'arabe, y compris les textes déguisés (4brut1, a b r u t i, lettres stylisées).

Tout se passe sur ton ordinateur. Aucune requête réseau, aucun compte, aucune statistique envoyée. Voyou ne signale, ne bloque et ne publie rien à ta place.

Le code est ouvert : github.com/chedli77/voyou

### EN

Voyou blurs hateful posts on X before you have time to read them: racist slurs, "go back to your country", threats, homophobia, sexism, monkey emoji. A "Show anyway" button reveals them if you want to see them.

You choose what gets hidden: racism, other hate, threats, insults, and profanity if you like. Three sensitivity levels, your own words to hide, accounts to never hide. Display names, bios and quoted posts are filtered too.

Voyou understands French, English, Spanish, Portuguese, Italian, German and Arabic, including disguised text (dumb4ss, s p a c e d letters, styled letters).

Everything runs on your computer. No network requests, no account, no analytics. Voyou never reports, blocks or posts anything on your behalf.

Open source: github.com/chedli77/voyou

### ES

Voyou difumina los mensajes de odio en X antes de que tengas tiempo de leerlos: insultos racistas, «vuelve a tu país», amenazas, homofobia, sexismo, emojis de mono. Un botón «Mostrar de todos modos» los muestra si quieres verlos.

Tú eliges qué se oculta: racismo, otros odios, amenazas, insultos y, si quieres, groserías. Tres niveles de sensibilidad, tus propias palabras que ocultar y cuentas que nunca se ocultan. También se filtran los nombres, las biografías y las publicaciones citadas.

Voyou entiende francés, inglés, español, portugués, italiano, alemán y árabe, incluidos los textos disfrazados.

Todo ocurre en tu ordenador. Sin peticiones de red, sin cuenta, sin estadísticas enviadas. Voyou nunca denuncia, bloquea ni publica nada por ti.

Código abierto: github.com/chedli77/voyou

### PT

O Voyou desfoca as mensagens de ódio no X antes que você tenha tempo de lê-las: insultos racistas, "volta pro teu país", ameaças, homofobia, sexismo, emojis de macaco. Um botão "Mostrar mesmo assim" revela a mensagem se você quiser ver.

Você escolhe o que é ocultado: racismo, outros ódios, ameaças, insultos e, se quiser, palavrões. Três níveis de sensibilidade, suas próprias palavras para ocultar e contas que nunca são ocultadas. Nomes, bios e publicações citadas também são filtrados.

O Voyou entende francês, inglês, espanhol, português, italiano, alemão e árabe, inclusive textos disfarçados.

Tudo acontece no seu computador. Sem requisições de rede, sem conta, sem estatísticas enviadas. O Voyou nunca denuncia, bloqueia nem publica nada por você.

Código aberto: github.com/chedli77/voyou

## Catégorie

Productivité (ou Réseaux sociaux si la boutique la propose).

## Questionnaire de confidentialité

Données collectées : aucune. Le texte des messages est analysé sur l'appareil et n'est ni transmis ni enregistré. Seuls les réglages, les comptes X de l'utilisateur, la langue de X, des compteurs sans texte ni compte et la position du module restent dans le stockage local de l'extension.

Justification de la permission `storage` : garder, uniquement en local, les réglages de l'utilisateur, les comptes X détectés comme étant les siens (pour ne pas masquer ses propres posts), la langue de l'interface de X (pour la popup), des compteurs de messages masqués par jour et par catégorie, et la position du module flottant.

Justification de l'accès à x.com et twitter.com (`host_permissions`) : lire les messages affichés pour flouter, sur l'appareil, ceux qui sont haineux. Rien n'est envoyé.

## Images

- Icône de la fiche : `icons/voyou-store-icon-128.png`, un dessin de 96 px centré dans 128 px transparents.
- Logo carré d'Edge : `icons/voyou-store-logo-300.png`.
- Captures : `npm run screenshots`, qui les écrit dans `dist/screenshots/`. Légendes : `05_SCREENSHOT_CAPTIONS.md`.
