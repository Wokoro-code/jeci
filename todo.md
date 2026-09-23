# JEC Network — suivi de développement

## Session du 28 août 2026 (suite) — priorité 1 : cœur produit membre

### Fait et validé
- [x] `Opportunities.tsx` : liste publique réelle, création avec modal (soumission → file d'attente admin), enregistrement (`saved`).
- [x] `Events.tsx` + `EventDetail.tsx` : liste publique réelle, création avec modal, inscription réelle (avec liste d'attente si complet).
- [x] `Mentorship.tsx` : liste des mentors réels, demande de mentorat avec modal, mes demandes (mentee/mentor), acceptation/refus, activation du statut mentor.
- [x] `Projects.tsx` : liste réelle, création d'espace avec modal (visibilité réseau/promotion/privé).
- [x] Nouveau module `server/db/saved.ts` + routeur `saved` (toggle/list/ids) pour les éléments enregistrés (posts, opportunités, événements, projets) — la table existait déjà dans le schéma, il manquait les endpoints.
- [x] Revérifié : `npm run check` (0 erreur), `npm test` (4/4), `npm run build` (réussi), `scripts/smoke.ts` (13/13) — aucune régression après ces changements.

## Session du 28 août 2026 — backend réel et cœur communautaire

### Fait et validé (compilation propre, tests unitaires + smoke test fonctionnel + test HTTP réels sur MariaDB)

**Base de données**
- [x] Schéma étendu : `passwordHash` sur `users`, + 15 tables (posts, postComments, postReactions, savedItems, reports, opportunities, events, eventRegistrations, mentorshipRequests, projects, projectMembers, notifications, campaigns).
- [x] Migration générée, appliquée et journal `__drizzle_migrations` synchronisé.

**Authentification réelle**
- [x] Inscription / connexion par mot de passe (bcrypt, 12 rounds), `changePassword`.
- [x] Correction de sécurité : `passwordHash` n'est plus jamais renvoyé au client (type `PublicUser` dédié dans le contexte tRPC, vérifié par requêtes HTTP réelles).
- [x] `requireActiveAccount` branché sur toutes les procédures protégées : un compte suspendu/désactivé ne peut plus rien faire.

**Backend organisé par domaine (`server/db/*`, un fichier par module)**
- [x] `users`, `roles`, `profiles` (annuaire + visibilité), `promotions`, `verification`, `notifications`, `connections` (réseau), `messaging`, `feed` (publications/commentaires/réactions), `reports` (signalements), `opportunities`, `events`, `mentorship`, `projects`, `campaigns` (communications officielles).
- [x] Règles du référentiel des rôles appliquées dans le code : vérification requise pour toute interaction, lecture ouverte même en attente, activation immédiate du rôle Mentor, retrait définitif réservé à l'Administrateur, journalisation (`server/db/audit.ts`) sur les actions sensibles.

**Routeurs tRPC**
- [x] `auth`, `account`, `network`, `messaging`, `feed`, `opportunities`, `events`, `mentorship`, `projects`, `notifications`, `reports`, `admin` — tous assemblés dans `server/routers.ts`.

**Frontend rebranché sur le vrai backend (fin du mock pour ces écrans)**
- [x] `Login.tsx` : inscription / connexion réelles.
- [x] `Home.tsx` : fil de publications réel (créer, réagir), suggestions issues de l'annuaire, événements à venir réels.
- [x] `Directory.tsx` : annuaire réel avec filtres (promotion, mentors), invitations de connexion réelles avec statut (connecté / en attente).
- [x] `Messages.tsx` : conversations et messages réels, restreints aux connexions acceptées.
- [x] `Settings.tsx` : visibilité d'annuaire et changement de mot de passe réels.
- [x] `admin/AdminVerifications.tsx` : file de vérification, justificatifs et décision (approuver/refuser/complément) réels et journalisés.

**Qualité**
- [x] `npm run check` (TypeScript) : 0 erreur.
- [x] `npm test` (vitest) : 4/4 tests passent.
- [x] `npm run build` (production) : réussi.
- [x] `scripts/smoke.ts` : script de test fonctionnel de bout en bout (13 assertions) sur une vraie base MariaDB — inscription, vérification, connexions, messagerie, fil, réactions, mentorat automatique, opportunités avec workflow admin, attribution de rôle. Rejouable avec `npx tsx scripts/smoke.ts` (nécessite `DATABASE_URL` pointant vers une base MySQL/MariaDB migrée).

### Reste à faire (backend prêt, interface encore sur données mockées ou manquante)

**Priorité 1 — pages membre restantes à rebrancher**
- [x] `Opportunities.tsx`, `Events.tsx` + `EventDetail.tsx`, `Mentorship.tsx`, `Projects.tsx` — faits dans la session du 28 août (suite).
- [ ] `Promotions.tsx` → `account.promotions` (déjà retourné avec effectifs), page espace de promotion à construire.
- [ ] `Saved.tsx` → le backend est prêt (`saved.list` renvoie déjà le contenu réel derrière chaque élément enregistré), il ne reste que le branchement de l'écran.
- [ ] `Profile.tsx` → `account.publicProfile` / `account.updateProfile` (édition complète + upload avatar).
- [ ] Formulaire de soumission des justificatifs de vérification (upload réel de fichiers vers le stockage — `account.submitVerification` attend déjà des `storageKey`, il manque l'intégration amont avec le stockage de fichiers).

**Priorité 2 — pages admin restantes à rebrancher**
- [ ] `AdminDashboard.tsx`, `AdminAlumni.tsx`, `AdminContent.tsx` (modération posts/signalements via `admin.reportQueue` / `decideReport` / `moderatePost`), `AdminOperations.tsx` (opportunités/événements en attente), `AdminOpportunityCreate.tsx`, `AdminCommunications.tsx` (`admin.campaigns` / `createCampaign` / `sendCampaign`), `AdminSettings.tsx` (gestion des rôles via `admin.roleAssignments` / `assignRole` / `revokeRole`, promotions via `admin.promotions` / `createPromotion`).

**Priorité 3 — infrastructure**
- [ ] Stockage de fichiers réel (avatars, pièces jointes de messagerie, justificatifs de vérification) : le schéma attend des `storageKey`, il manque le service d'upload/serving.
- [ ] Notifications : le backend est prêt (`notifications.list/unreadCount/markRead`), il manque le composant cloche dans la nav.
- [ ] Emails transactionnels (actuellement tout passe par les notifications internes uniquement).
- [ ] Découpage du bundle client (avertissement Vite : chunk > 500 kB) — optimisation, non bloquant.

### Comment reprendre le développement
1. Une base MySQL/MariaDB doit être disponible et migrée : `npm run db:push` (ou appliquer manuellement `drizzle/0000_fancy_luminals.sql` puis `drizzle/0001_spooky_johnny_storm.sql` si `drizzle-kit migrate` s'interrompt silencieusement — bug d'affichage du spinner déjà rencontré, l'application directe via `mysql < fichier.sql` fonctionne).
2. `npm run dev` démarre le serveur complet (client + API tRPC) sur le port 3000.
3. `npx tsx scripts/smoke.ts` revalide les parcours métier critiques après toute modification du backend.

---

## Historique (interface administrateur — itérations précédentes sur données mockées)

- [x] Filtrer les rôles JEC révoqués et ajouter le guard dédié aux mentors.
- [x] Ajouter la consultation sécurisée des demandes et justificatifs de vérification côté alumni et administration.
- [x] Vérifier l’absence de placeholders dans les helpers et procédures backend fondamentaux.
- [x] Brancher les autorisations serveur sur les rôles JEC réels : Alumni, Mentor, Modérateur et Administrateur.
- [x] Compléter le cycle backend de vérification : soumission, pièces justificatives et revue administrative.
- [x] Finaliser les helpers et procédures fondamentales sans placeholders de backend.
- [x] Activer le projet full-stack et implémenter les fondations backend : comptes, profils, vérifications et rôles.
- [x] Concevoir le modèle de données : comptes, profils, rôles, vérifications, connexions et messagerie ; validation métier en attente.
- [x] Valider les droits des alumni en cours de validation et des alumni vérifiés, ainsi que la gouvernance Mentor, Modérateur et Administrateur.
- [x] Formaliser la matrice des rôles et droits Alumni, Mentor, Modérateur et Administrateur ; validation métier en attente.
- [x] Ajouter une visionneuse plein écran d’images et de PDF dans les conversations.
- [x] Ajouter prévisualisation, lecture et téléchargement des pièces jointes reçues dans les conversations.
- [x] Ajouter à la messagerie le partage de fichiers et l’enregistrement vocal avec prévisualisation et envoi simulé.
- [x] Fixer la zone de saisie au bas des conversations mobiles, au-dessus de la navigation basse.
- [x] Étendre le sélecteur de nouveau message et l’ouverture de conversation aux interfaces desktop.
- [x] Ajouter un sélecteur de nouveau message pour les alumni déjà connectés dans la messagerie mobile.
- [x] Corriger les anomalies UX mobiles relevées : signalements, création d’opportunité, confirmation destructive, messagerie et repère administrateur.
- [x] Réaliser une recette UX complète des parcours mobiles Alumni et Administration, puis prioriser les anomalies sans modifier le code.
- [x] Ouvrir les détails sélectionnés dans des vues mobiles dédiées avec retour, côté Alumni et Administration.
- [x] Uniformiser les recherches et filtres des pages mobile Alumni et Administration avec déclencheurs fixes et panneaux superposés.
- [x] Transformer le filtre mobile Alumni en panneau superposé et rendre son déclencheur fixe sous le header au défilement.
- [x] Préparer et intégrer le logo officiel JEC dans les composants d’identité membre et administrateur.
- [x] Corriger le défilement et les décalages de la sidebar administrateur sur toutes les pages et tailles d’écran.
- [x] Analyser les maquettes administrateur fournies et relever les écrans, composants et états à préserver.
- [x] Définir une navigation administrateur distincte mais cohérente avec la marque JEC Network.
- [x] Créer les modèles de données mockées pour les membres, contenus, événements, opportunités et indicateurs.
- [x] Implémenter le tableau de bord et les pages de gestion nécessaires, avec des interactions de démonstration.
- [x] Vérifier la responsivité, l’accessibilité et les parcours clés avant livraison.
- [x] Créer un point de restauration de la version administrateur validée.
