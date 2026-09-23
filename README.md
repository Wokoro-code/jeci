# JEC Network

Réseau mondial social, professionnel et communautaire des Jécistes et anciens Jécistes. Frontend React + Vite,
backend Express + tRPC + Drizzle ORM (MySQL). Le projet est **100%
autonome** : plus aucune dépendance à une plateforme externe.

## Prérequis

- Node.js 18.18 ou supérieur (recommandé : 20 LTS)
- npm
- Optionnel : Docker (pour lancer une base MySQL locale en une commande) ou
  une instance MySQL/MariaDB déjà installée

## Démarrage rapide (mode démo, sans base de données)

```bash
npm install
npm run dev
```

L'application démarre sur http://localhost:3000. Sans base de données
configurée, toutes les pages fonctionnent avec des données de démonstration
(`client/src/data/mockData.ts`), mais la connexion et la persistance des
données réelles (profils, vérifications, etc.) sont désactivées.

## Démarrage complet (avec base de données)

1. Copiez `.env.example` en `.env` :
   ```bash
   cp .env.example .env
   ```
2. Lancez une base MySQL locale via Docker :
   ```bash
   docker compose up -d
   ```
   (ou pointez `DATABASE_URL` dans `.env` vers votre propre instance MySQL/MariaDB)
3. Appliquez le schéma de base de données :
   ```bash
   npm run db:push
   ```
4. Lancez l'application :
   ```bash
   npm run dev
   ```

## Build de production

```bash
npm run build
npm start
```

## Tests

```bash
npm test
```

## Vérification TypeScript

```bash
npm run check
```

## ⚠️ Authentification locale (mode développement)

Ce projet a été exporté depuis une plateforme de génération en ligne (Manus)
qui gérait l'authentification via son propre système OAuth, indisponible en
dehors de leur infrastructure. Elle a été remplacée par une **connexion
locale simplifiée** (page `/login`) : il suffit de renseigner un e-mail pour
créer ou retrouver un compte, sans vérification de mot de passe.

**Ce mécanisme est prévu pour le développement local uniquement.** Avant tout
déploiement public, remplacez-le par une vraie authentification (mot de
passe + hash, OAuth avec un fournisseur réel comme Google/GitHub, etc.). Le
point d'entrée à modifier est `server/routers.ts` (mutation `auth.devLogin`)
et `client/src/pages/Login.tsx`.

## Stockage de fichiers

Par défaut, les fichiers (documents de vérification, avatars, etc.) sont
stockés sur le disque local dans `./uploads` et servis sous `/uploads/*`
(voir `server/storage.ts`). Pour utiliser Amazon S3 (ou un service
compatible S3) en production, renseignez `S3_BUCKET`, `AWS_ACCESS_KEY_ID` et
`AWS_SECRET_ACCESS_KEY` dans `.env` — le basculement est automatique.

## Ce qui a été corrigé pour rendre le projet indépendant

Le projet exporté contenait des dépendances et du code spécifiques à la
plateforme Manus, incompatibles avec un usage local en dehors de celle-ci :

- **`@builder.io/vite-plugin-jsx-loc` / `vite-plugin-manus-runtime`** :
  provoquaient le conflit `ERESOLVE` avec Vite 7 lors de `npm install`.
  Supprimés (outils de debug internes à la plateforme).
- **Dossier `server/_core/` incomplet** : la plateforme injecte
  automatiquement à l'exécution tout un pan de l'infrastructure serveur
  (authentification OAuth, contexte tRPC, variables d'environnement,
  routeur système, point d'entrée Express) qui n'est pas exporté dans le
  zip. Ces fichiers ont été réécrits de zéro :
  `server/_core/env.ts`, `cookies.ts`, `context.ts`, `systemRouter.ts`,
  `index.ts`, ainsi que `client/src/_core/hooks/useAuth.ts` et
  `shared/_core/errors.ts`.
- **OAuth Manus** (`VITE_OAUTH_PORTAL_URL`, `VITE_APP_ID`, callback
  `/api/oauth/callback`) : remplacé par la connexion locale décrite
  ci-dessus.
- **Stockage de fichiers** (`server/storage.ts`) : passait par un proxy S3
  interne à Manus (Forge). Réécrit pour utiliser le disque local par défaut,
  avec bascule optionnelle vers S3.
- **Composant `Map.tsx`** : chargeait Google Maps via un proxy interne
  (`forge.butterfly-effect.dev`). Il charge maintenant directement l'API
  Google Maps standard avec une clé fournie par vous (`VITE_GOOGLE_MAPS_API_KEY`).
- **Images `/manus-storage/...`** (inaccessibles hors plateforme) et favicon
  cassé : remplacés par des images publiques et un favicon local.
- **`ManusDialog.tsx`** et le fallback `manus-cookie` dans `main.tsx` : code
  mort spécifique à l'environnement de prévisualisation Manus, supprimé.
- **`pnpm-lock.yaml`**, le patch pnpm sur `wouter`, et `template.json` :
  spécifiques à pnpm/Manus, supprimés. Le projet utilise `npm`.
- **Bug de chemin en production** : le calcul du dossier racine du serveur
  se basait sur l'emplacement du fichier source, ce qui cassait une fois le
  code empaqueté par esbuild dans `dist/`. Corrigé pour utiliser le
  répertoire de travail (`process.cwd()`).

Après ces corrections, `npm install`, `npm run dev`, `npm run build` et
`npm test` fonctionnent sans erreur, avec ou sans base de données configurée.
