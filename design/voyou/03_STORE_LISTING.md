# Fiche Chrome Web Store, Edge Add-ons et Firefox Add-ons

Textes prêts à coller. Les limites de longueur sont vérifiées par `node -e` (voir la fin du fichier).

Politique de confidentialité : https://chedli77.github.io/voyou/confidentialite/

## Nom

Voyou, filtre la haine sur X

## Description courte (132 caractères maximum)

FR : Floute la haine sur X pendant que tu scrolles : racisme, menaces, insultes. En local, sur ton appareil.

EN : Blurs hate on X while you scroll: racism, threats, insults. Locally, on your device.

ES : Difumina el odio en X mientras navegas: racismo, amenazas, insultos. En local, en tu dispositivo.

PT : Desfoca o ódio no X enquanto você rola a tela: racismo, ameaças, insultos. Localmente, no seu dispositivo.

## Description détaillée

### FR

Voyou floute les messages haineux sur X avant que tu aies le temps de les lire : insultes racistes, « retourne dans ton pays », menaces, homophobie, sexisme, singes en emoji. Un bouton « Afficher quand même » les révèle si tu veux les voir.

Tu choisis ce qui est masqué : racisme, autres haines, menaces, insultes, et si tu veux, la vulgarité. Trois niveaux de sensibilité, tes propres mots à masquer, des comptes à ne jamais masquer. Les noms d'affichage, les bios et les tweets cités sont filtrés aussi.

Voyou reconnaît le français, l'anglais, l'espagnol, le portugais, l'italien, l'allemand et l'arabe, y compris les textes déguisés (n1gg3r, s a l e, lettres stylisées).

Tout se passe sur ton ordinateur. Aucune requête réseau, aucun compte, aucune statistique envoyée. Voyou ne signale, ne bloque et ne publie rien à ta place.

Le code est ouvert : github.com/chedli77/voyou

### EN

Voyou blurs hateful posts on X before you have time to read them: racist slurs, "go back to your country", threats, homophobia, sexism, monkey emoji. A "Show anyway" button reveals them if you want to see them.

You choose what gets hidden: racism, other hate, threats, insults, and profanity if you like. Three sensitivity levels, your own words to hide, accounts to never hide. Display names, bios and quoted posts are filtered too.

Voyou understands French, English, Spanish, Portuguese, Italian, German and Arabic, including disguised text (n1gg3r, s p a c e d letters, styled letters).

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

Données collectées : aucune. Le texte des messages est analysé sur l'appareil et n'est ni transmis ni enregistré. Les réglages et des compteurs anonymes restent dans le stockage local de l'extension.

Justification de la permission `storage` : enregistrer les réglages de l'utilisateur, son compte X (pour ne pas masquer ses propres posts) et des compteurs de messages masqués, uniquement en local.

Justification de l'accès à x.com et twitter.com : lire les messages affichés pour flouter ceux qui sont haineux.

## Vérifier les longueurs

```bash
node -e 'const s=require("fs").readFileSync("design/voyou/03_STORE_LISTING.md","utf8");for(const m of s.matchAll(/^(FR|EN|ES|PT) : (.+)$/gm))console.log(m[1],m[2].length)'
```
