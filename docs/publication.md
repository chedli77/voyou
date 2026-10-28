# Publication

## Le cycle

1. On travaille sur `dev` (ou une branche partie de `dev`), avec une pull request vers `dev`.
2. On teste `dev` : `npm run check`, `npm run test:dom`, puis l'extension chargée depuis `extension/` sur le vrai x.com.
3. Quand c'est bon, on monte la version (`extension/manifest.json` et `package.json`), on complète `docs/CHANGELOG.md`, et on ouvre une pull request de `dev` vers `main`. Si le dossier `extension/` change, la CI refuse une version qui n'est pas plus récente que la dernière publiée.
4. Le merge sur `main` lance `.github/workflows/release.yml` : vérifications, tag, release GitHub avec les zips Chrome, Edge et Firefox et leur attestation de provenance, puis envoi au Chrome Web Store et soumission à la validation de Google. L'environnement `production` demande ta validation avant de lancer la publication.
5. Edge et Firefox : télécharge les zips de la release et envoie les à la main, dans le [Partner Center d'Edge](https://partner.microsoft.com/dashboard/microsoftedge) et sur [addons.mozilla.org](https://addons.mozilla.org/developers/). Le zip Firefox a déjà le bon manifest.

Un merge sans changement de version ne publie rien et ne demande aucune validation. Chaque release porte, à côté des zips, leur preuve d'origine (`voyou-<version>.intoto.jsonl`) : `gh attestation verify voyou-<version>-chrome.zip --repo chedli77/voyou` confirme qu'un zip a bien été construit par ce dépôt.

## Brancher le Chrome Web Store (une seule fois)

Aucun mot de passe ni clé n'est stocké dans GitHub. GitHub prouve son identité à Google Cloud à chaque publication (fédération d'identité), et Google lui donne un jeton valable une heure.

1. Dans [Google Cloud](https://console.cloud.google.com), crée un projet et active l'API « Chrome Web Store API ».
2. Crée un compte de service, sans rôle.
3. Dans le [tableau de bord développeur du Chrome Web Store](https://chrome.google.com/webstore/devconsole), section Compte, ajoute l'adresse de ce compte de service. Note l'identifiant d'éditeur (Publisher ID) affiché dans les paramètres.
4. Crée un pool de fédération d'identité pour GitHub, limité à ce dépôt :

   ```bash
   gcloud iam workload-identity-pools create github --location=global
   gcloud iam workload-identity-pools providers create-oidc voyou \
     --location=global --workload-identity-pool=github \
     --issuer-uri=https://token.actions.githubusercontent.com \
     --attribute-mapping=google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref \
     --attribute-condition="assertion.repository == 'chedli77/voyou' && assertion.ref == 'refs/heads/main'"
   ```

5. Autorise ce pool à utiliser le compte de service (rôle « Workload Identity User » sur le compte de service, pour le principal `principalSet://iam.googleapis.com/projects/NUMERO_DU_PROJET/locations/global/workloadIdentityPools/github/attribute.repository/chedli77/voyou`).
6. Dans GitHub, Settings, Environments, crée l'environnement `production` et ajoute trois variables (pas des secrets, ce ne sont que des identifiants publics) :
   - `GCP_WORKLOAD_IDENTITY_PROVIDER` : `projects/NUMERO_DU_PROJET/locations/global/workloadIdentityPools/github/providers/voyou`
   - `GCP_SERVICE_ACCOUNT` : l'adresse du compte de service
   - `CWS_PUBLISHER_ID` : l'identifiant d'éditeur

Tant que ces variables n'existent pas, le merge crée quand même la release GitHub et le zip ; il ne reste qu'à l'envoyer à la main dans le tableau de bord.

L'environnement `production` a un relecteur obligatoire : chaque publication attend ton clic dans l'onglet Actions.
