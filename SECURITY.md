# Sécurité

## Signaler une faille

Ne passe pas par une issue publique. Utilise le [signalement privé de GitHub](https://github.com/chedli77/voyou/security/advisories/new) (onglet Security, « Report a vulnerability »).

Décris le problème, comment le reproduire et ce qu'il permet. Tu recevras une réponse sous 7 jours. Une faille confirmée est corrigée dans les 30 jours quand c'est possible, puis publiée dans un avis de sécurité qui te crédite si tu le souhaites.

## Ce qui nous intéresse

Voyou tourne sur x.com et voit le texte des tweets. Sont notamment des failles :

1. du contenu d'une page X qui arrive à exécuter du code ou à modifier l'interface de Voyou ;
2. une fuite de texte, de pseudo ou d'historique hors de l'appareil ;
3. une permission demandée au navigateur sans raison.

Un message haineux qui passe le filtre ou un message normal masqué n'est pas une faille : ouvre une issue avec le modèle prévu.

## Versions suivies

Seule la dernière version publiée, celle de la dernière [release](https://github.com/chedli77/voyou/releases/latest), reçoit des correctifs.
