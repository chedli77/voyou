# Publication

## Le cycle

1. On travaille sur `dev` (ou une branche partie de `dev`), avec une pull request vers `dev`.
2. On teste `dev` : `npm run check`, `npm run test:dom`, puis l'extension chargée depuis `extension/` sur le vrai x.com. Pour Firefox : `npm run package`, puis charge `dist/firefox/manifest.json` depuis `about:debugging` (« Ce Firefox », « Charger un module complémentaire temporaire »).
3. Quand c'est bon, on monte la version (`extension/manifest.json` et `package.json`), on ajoute sa section `## X.Y.Z` à `docs/CHANGELOG.md`, et on ouvre une pull request de `dev` vers `main`. Si le dossier `extension/` change, la CI refuse une version qui n'est pas plus récente que la dernière publiée, ou qui n'a pas sa section dans le CHANGELOG.
4. Le merge sur `main` lance `.github/workflows/release.yml`. Un premier job refait les vérifications. Puis, une fois ta validation donnée (environnement `production`), un second job crée le tag et la release GitHub : les zips Chrome, Edge et Firefox, leur preuve d'origine, et la section du CHANGELOG comme notes. Il envoie ensuite le zip Chrome au Chrome Web Store et le soumet à la validation de Google.
5. Edge et Firefox : télécharge les zips de la release et envoie-les à la main, dans le [Partner Center d'Edge](https://partner.microsoft.com/dashboard/microsoftedge) et sur [addons.mozilla.org](https://addons.mozilla.org/developers/). Le zip Firefox a déjà le bon manifest. Comme ses bundles sont produits par esbuild, addons.mozilla.org demande aussi les sources : joins l'archive « Source code (zip) » que GitHub crée pour le tag de la release, avec cette note pour la relecture :

   ```text
   Requires Node 22 or newer. Run `npm ci`, then `npm run build`: it rebuilds
   extension/content/content.bundle.js and extension/popup/popup.bundle.js, the only
   generated code in the add-on. `node scripts/build.js --check` confirms that they
   match the submitted files.
   ```

   Avant l'envoi, essaie ce zip dans Firefox : ouvre un onglet x.com, puis charge le zip depuis `about:debugging` (« Ce Firefox », « Charger un module complémentaire temporaire »). Vérifie qu'un tweet haineux arrivé après le chargement est flouté, qu'il ne reste qu'un seul module flottant après avoir rechargé le module temporaire, et qu'aucun bouton Voyou ne reste sur les tweets une fois le module désactivé.

6. Si le voile, le module, le panneau ou la popup ont changé, refais les captures et mets à jour la fiche dans les trois boutiques (voir plus bas).

Un merge sans changement de version ne publie rien et ne demande aucune validation. Chaque release porte, à côté des zips, leur preuve d'origine (`voyou-<version>.intoto.jsonl`) : `gh attestation verify voyou-<version>-chrome.zip --repo chedli77/voyou` confirme qu'un zip a bien été construit par ce dépôt.

Le job qui publie ne lance aucun code des dépendances npm : il zippe les bundles commités (`node scripts/package.js --no-build`), que le premier job a comparés à un build neuf.

Si l'envoi au Chrome Web Store échoue (version précédente encore en validation, erreur passagère), relance seulement le job en échec depuis l'onglet Actions (« Re-run failed jobs ») : il reprend le zip de la release au lieu d'en refaire un. Tu peux aussi envoyer ce zip à la main dans le tableau de bord.

## Fiche des boutiques

`scripts/publish-store.js` n'envoie que le paquet. Les textes et les images de la fiche se mettent à jour à la main, dans le tableau de bord du Chrome Web Store, le Partner Center d'Edge et sur addons.mozilla.org.

- Textes : `design/voyou/03_STORE_LISTING.md`. Le nom et la description courte viennent du paquet (`name` du manifest, `extDescription` des `_locales`).
- Icônes : `design/voyou/icons/voyou.svg` est la source de `extension/icons/icon48.png` et `icon128.png`, et `voyou-16.svg`, simplifié, celle de `icon16.png` et `icon32.png`. Pour la fiche : `voyou-store-icon-128.png`, un dessin de 96 px centré dans 128 px transparents comme le demande le Chrome Web Store, et `voyou-store-logo-300.png` pour Edge. Toutes sont exportées en PNG sans métadonnées : `node scripts/check-images.js`, lancé par `npm run check`, refuse tout bloc PNG en dehors de l'image elle-même, les JPEG et les SVG qui portent des métadonnées.
- Captures : `npm run screenshots` charge l'extension dans Chromium sur une page X factice et écrit trois images de 1280 × 800 dans `dist/screenshots/`, un format que les trois boutiques acceptent. Elles ne sont pas commitées : on les refait à chaque version qui change l'interface. Leurs légendes, pour addons.mozilla.org, sont dans `design/voyou/05_SCREENSHOT_CAPTIONS.md`.
- Ce que montrent les captures : des comptes et des textes inventés, des avatars en aplat, aucun compte « Voyou » sur X ni badge de certification. Aucun texte haineux lisible : les posts haineux restent voilés, et le post révélé n'est masqué que par un mot choisi.
- La fiche du Chrome Web Store (`kmoeediamoohgahdjihebjnckpgdeege`) est en cours de validation. Une fois qu'elle est publique, remets dans le README son lien et le badge du Store.

## Brancher le Chrome Web Store (une seule fois)

Aucun mot de passe ni clé n'est stocké dans GitHub. GitHub prouve son identité à Google Cloud à chaque publication (fédération d'identité), et Google lui donne un jeton valable une heure.

1. Dans [Google Cloud](https://console.cloud.google.com), crée un projet et active l'API « Chrome Web Store API ».
2. Crée un compte de service, sans rôle.
3. Dans le [tableau de bord développeur du Chrome Web Store](https://chrome.google.com/webstore/devconsole), section Compte, ajoute l'adresse de ce compte de service. Note l'identifiant d'éditeur (Publisher ID) affiché dans les paramètres.
4. Crée un pool de fédération d'identité pour GitHub, limité au job de publication de ce dépôt. `gh api repos/chedli77/voyou --jq '.id, .owner.id'` donne les identifiants du dépôt et de son propriétaire :

   ```bash
   gcloud iam workload-identity-pools create github --location=global
   gcloud iam workload-identity-pools providers create-oidc voyou \
     --location=global --workload-identity-pool=github \
     --issuer-uri=https://token.actions.githubusercontent.com \
     --attribute-mapping=google.subject=assertion.sub,attribute.repository_id=assertion.repository_id \
     --attribute-condition="assertion.repository_id == 'ID_DU_DEPOT' && assertion.repository_owner_id == 'ID_DU_PROPRIETAIRE' && assertion.ref == 'refs/heads/main' && assertion.environment == 'production' && assertion.workflow_ref == 'chedli77/voyou/.github/workflows/release.yml@refs/heads/main'"
   ```

   Contrairement aux noms, ces identifiants ne changent pas quand un dépôt ou un compte est renommé. Avec cette condition, seul le job lié à l'environnement `production` de `release.yml` obtient un jeton : ni Scorecard ni un autre workflow de `main`.

5. Autorise ce pool à utiliser le compte de service (rôle « Workload Identity User » sur le compte de service, pour le principal `principalSet://iam.googleapis.com/projects/NUMERO_DU_PROJET/locations/global/workloadIdentityPools/github/attribute.repository_id/ID_DU_DEPOT`).
6. Dans GitHub, Settings, Environments, crée l'environnement `production` et ajoute trois variables (pas des secrets, ce ne sont que des identifiants publics) :
   - `GCP_WORKLOAD_IDENTITY_PROVIDER` : `projects/NUMERO_DU_PROJET/locations/global/workloadIdentityPools/github/providers/voyou`
   - `GCP_SERVICE_ACCOUNT` : l'adresse du compte de service
   - `CWS_PUBLISHER_ID` : l'identifiant d'éditeur

Tant que ces variables n'existent pas, le merge crée quand même la release GitHub et les zips ; il ne reste qu'à envoyer le zip Chrome à la main dans le tableau de bord.

L'environnement `production` a un relecteur obligatoire : chaque publication attend ton clic dans l'onglet Actions.
