# Migration CSPP Alumni → JEC Network — journal de migration

Ce document résume ce qui a été livré dans cette passe de migration, conformément
au cahier des charges JEC Network, et ce qui reste à faire avant mise en production.

Statut de vérification au moment de la livraison :
- `npm install` (installation propre) : OK
- `npm run check` (TypeScript, 0 erreur) : OK
- `npm run build` (Vite + esbuild) : OK
- `npx vitest run` (4 tests existants) : OK
- Migration Drizzle générée (`drizzle/0000_brief_rocket_racer.sql`, 31 tables) : OK, jamais appliquée à une base réelle

## Ce qui est fait

### Phase 1 — Audit
Rapport d'audit technique livré avant toute modification (architecture, schéma,
fonctionnalités existantes, mapping CSPP → JEC proposé).

### Phase 2 — Nettoyage des références CSPP
Toutes les occurrences fonctionnelles de « CSPP » ont été retirées du code
source (`client/`, `server/`, `shared/`, `drizzle/`), des e-mails transactionnels,
des fichiers `.env`/`.env.example`/`docker-compose.yml`, du `package.json` et du
`README.md`. Les fichiers de notes internes ont été renommés
(`roles-et-droits-cspp.md` → `roles-et-droits-jec.md`,
`schema-donnees-cspp-v1.md` → `schema-donnees-jec-v1.md`).

### Phase 3 — Nouvelle architecture de données JEC
- `organizationalUnits` : hiérarchie JECI **configurable** par auto-référence
  (`parentId`), avec niveaux international / régional / national / local /
  groupe — pas de profondeur figée imposée à un mouvement national.
- `jecProfiles` (remplace `alumniProfiles`) : statut JEC déclaratif,
  confidentialité par champ (email, téléphone, ville, parcours JEC, parcours
  professionnel), disponibilités (mentorat, expertise, accompagnement projet).
- `jecExperiences` : « Mon parcours JEC », distinct du CV professionnel.
- `communities` / `communityMembers` : communautés internationales,
  régionales, nationales, professionnelles, thématiques.
- `vjaSheets` : fiches Voir-Juger-Agir.
- `memoryEntries` : Mémoire JEC (patrimoine numérique, modéré avant
  publication).
- RBAC scopé : `roles` (dix codes du cahier §28, de `member` à `super_admin`)
  + `userRoles.scopeType/scopeId` pour que, par exemple, un administrateur
  national du Togo n'ait de droits que sur cette structure.

### Phase 4 — Transformation des profils
Page Profil réécrite : statut JEC, structure de rattachement, confidentialité
par champ, et section « Mon parcours JEC » (ajout/suppression d'étapes) en
plus du volet professionnel existant.

### Phase 5 — Annuaire mondial
`Directory.tsx` réécrit : filtres par structure organisationnelle, statut
JEC, disponibilité mentorat ; affichage de la structure et du statut JEC de
chaque profil.

### Phase 6 — Organisation et communautés
- `Organization.tsx` (remplace `Promotions.tsx`) : navigation dans la
  hiérarchie JECI, fil d'Ariane, compteur de membres par structure.
- `UnitDetail.tsx` (remplace `PromotionDetail.tsx`) : fiche d'une structure +
  son groupe de discussion officiel.
- `Communities.tsx` / `CommunityDetail.tsx` : liste filtrable par portée,
  création d'une communauté thématique, rejoindre/quitter.

### Phase 7 — Fil d'actualité
Conservé et étendu : les publications portent désormais une catégorie
(actualité, témoignage, réflexion, projet, opportunité, événement, formation,
appel à contribution, recherche de compétences/bénévoles — cahier §14).

### Phase 8 — Mentorat / opportunités / projets
Conservés et adaptés :
- Opportunités : catégories alignées sur le cahier §20 (emploi, stage,
  bénévolat, bourse, formation, appel à projets, financement, mission,
  expertise, autre).
- Projets : statuts alignés sur le cahier §21 (idée, en préparation, en
  cours, terminé, suspendu).
- Mentorat : logique conservée telle quelle.

### Identité JEC propre
- `VoirJugerAgir.tsx` : création et consultation de fiches Voir-Juger-Agir.
- `Memory.tsx` : contributions à la Mémoire JEC, publiées après validation.

### Phase 9 — Administration
- `AdminMembers.tsx` (remplace `AdminAlumni.tsx`) : registre des membres avec
  statut JEC et structure.
- `AdminOperations.tsx` : la section `AdminPromotions` est remplacée par
  `AdminOrganization` (gestion de la hiérarchie JECI).
- `AdminSettings.tsx` : gestion des rôles RBAC scopés et des structures
  organisationnelles.
- Tableau de bord, modération, vérification, opportunités/événements/projets :
  conservés, adaptés aux nouveaux types.

### Phase 10 — Tests et vérification
- Compilation TypeScript strict sans erreur (backend + frontend + admin).
- Build de production (`vite build` + `esbuild`) réussi.
- Suite de tests existante (Vitest) toujours au vert.
- Migration Drizzle générée pour le nouveau schéma.

## Mise à jour — retours utilisateur du 20 septembre 2026

Six demandes traitées suite aux premiers tests avec une base MariaDB locale :

1. **Filtres de l'annuaire** : le filtre pays comparait un texte libre à une
   égalité stricte au lieu d'une recherche partielle (corrigé, `LIKE`). Le
   filtre par **statut JEC** — prévu au cahier §11 mais absent de
   l'interface — a été ajouté, avec pastilles colorées.
2. **Couleurs par statut JEC** (`client/src/lib/jecStatus.ts`) : Jéciste actif
   = bleu, Ancien Jéciste = vert, Ancien responsable = or, Responsable actuel
   = café (couleurs demandées). Couleurs choisies pour les statuts non
   précisés : Aumônier = violet, Animateur/accompagnateur = sarcelle,
   Volontaire = orange, Ami/sympathisant = gris neutre. Un badge réutilisable
   (`JecStatusBadge`) est utilisé dans l'annuaire, le profil et
   l'administration des membres.
3. **Adhésion à une communauté sur demande** : nouvelle colonne
   `communityMembers.status` (pending/approved/rejected). Un membre demande à
   rejoindre (`communities.requestToJoin`), un administrateur de la
   communauté valide ou refuse (`communities.decideMembership`), visible
   dans l'en-tête de la fiche communauté.
4. **Création de communauté réservée aux responsables actuels** :
   `assertCanCreateCommunity` (serveur) vérifie `jecStatus === "current_leader"`
   (ou super administrateur) avant toute création ; le bouton "Créer une
   communauté" est désactivé côté client sinon, avec message explicatif.
5. **Logo JECI-IYCS intégré** : remplace `favicon.png` (utilisé par l'onglet
   du navigateur, l'en-tête principal `AppHeader`, le panneau
   d'administration `AdminLayout`, et désormais affiché sur la page de
   connexion). L'ancien fichier `cspp-logo.jpg`, non référencé, a été
   supprimé.
6. **Éléments manquants d'une communauté (cahier §15)** : une communauté
   possède désormais, en plus du nom/description/image/administrateurs/
   membres déjà présents : **publications** (`posts.communityId`),
   **événements** (`events.communityId`), **projets**
   (`projects.communityId`), **documents** (nouvelle table
   `communityDocuments`, upload via un nouveau type `community_document`) et
   **discussion** (conversation de groupe dédiée, `conversations.communityId`,
   sur le même principe que le groupe de discussion d'une structure
   organisationnelle). La fiche communauté (`CommunityDetail.tsx`) affiche
   désormais ces six onglets : Publications, Événements, Projets, Documents,
   Discussion, Membres.

Migration Drizzle incrémentale générée : `drizzle/0001_concerned_bloodaxe.sql`
(purement additive — nouvelles colonnes nullables/à valeur par défaut et
nouvelle table, aucune perte de données sur la base déjà créée). À appliquer
avec `npm run db:push`.

Vérifications refaites après ces changements : `npm run check` (0 erreur),
`npm run build` (OK), `npx vitest run` (4/4).

### Limite assumée sur ce lot de changements
Les événements et projets créés depuis une fiche communauté suivent les
mêmes règles que partout ailleurs dans l'application (un événement reste
`pending` jusqu'à validation par l'administration, cahier §22/§27) : ce n'est
pas un contournement propre à la communauté, c'est le comportement standard
déjà en place. Le fil d'actualité d'une communauté est une liste simple sans
réactions/commentaires dédiés au niveau communauté pour l'instant (ceux-ci
restent au niveau de la publication elle-même comme sur le fil global).

## Mise à jour — retours utilisateur du 20 septembre 2026 (2ᵉ lot)

1. **Titre de l'onglet navigateur et branding restant** : un scan complet
   (précédemment limité aux `.ts`/`.tsx`) a révélé que `client/index.html`
   n'avait pas été nettoyé — le titre affichait encore « CSPP Alumni — Le
   réseau des diplômés ». Corrigé en « JECI — Réseau international des
   Jécistes », de même que la meta description et les textes du visualiseur
   de médias intégré à la page.
2. **Rebranding « JEC Network » → « JECI »** : toutes les mentions visibles
   (en-tête, panneau d'administration, page de connexion, pied de page,
   noms de secours affichés à la place d'un nom manquant) utilisent
   désormais « JECI », cohérent avec le logo fourni.
3. **Bug de navigation corrigé** : plusieurs liens (recherche dans l'en-tête,
   barre de navigation mobile, page d'accueil) pointaient encore vers
   l'ancienne route `/alumnis`, supprimée lors d'une passe précédente — ils
   ont été redirigés vers `/annuaire`.
4. **« Réseau des diplômés » → « Réseau international des Jécistes »** :
   remplacé partout où il apparaissait, ainsi que les nombreuses occurrences
   résiduelles de « alumni »/« diplômés » dans les textes visibles (fils
   d'actualité, mentorat, opportunités, messagerie, réseau, administration) —
   remplacées par « Jéciste(s) » ou « membre(s) » selon le contexte. Le
   dernier vestige scolaire (« diplôme, carte d'ancien élève ») dans la page
   de vérification de compte a aussi été retiré.
5. **Palette de couleurs du logo appliquée** : extraction des couleurs
   dominantes du logo JECI-IYCS fourni — indigo (`#5B4FE0`, croix) et orange
   (`#F07030`, flamme). L'accent doré générique utilisé dans toute
   l'application (sélections actives, badges, boutons de filtre, bordures
   d'éléments sélectionnés) a été remplacé par cet indigo ; les éléments à
   connotation « mise en avant / attention » (badges « en attente »,
   notifications non lues, alertes de vérification) utilisent l'orange.
   Le jeton CSS `--accent` (`client/src/index.css`) a été mis à jour en
   conséquence. **Les couleurs des statuts JEC** (`client/src/lib/jecStatus.ts`,
   bleu/vert/or/café + les 4 couleurs choisies au tour précédent) n'ont **pas**
   été touchées : elles restent indépendantes de ce rebranding, comme
   explicitement demandé.

Vérifications refaites : `npm run check` (0 erreur), `npm run build` (OK),
`npx vitest run` (4/4).

## Mise à jour — retours utilisateur du 20 septembre 2026 (3ᵉ lot : audit approfondi du cahier des charges)

Nouvelle relecture complète du cahier, section par section. Manques confirmés
et corrigés :

1. **Mentorat (§19)** : le cahier demande des filtres domaine/pays/langue/
   disponibilité — aucun n'existait. Ajoutés (`server/db/mentorship.ts`,
   `Mentorship.tsx`), avec une recherche libre en guise de proxy pour
   « expérience », faute d'un champ structuré dédié dans le cahier.
2. **Événements (§22)** : le champ `type` (rencontre/camp/formation/
   conférence/assemblée/réunion/webinaire/activité sociale/rencontre
   internationale) n'existait pas du tout en base, ni les champs « image »
   et « lien d'inscription » pourtant explicitement listés. Ajoutés au
   schéma, au formulaire de création et à un filtre par type sur la page.
3. **Opportunités (§20)** : filtre par catégorie ajouté (le type existait en
   base mais n'était pas filtrable côté interface).
4. **« Vous connaissez peut-être » (§17, §42)** : absent. Implémenté :
   suggestions basées sur la même structure organisationnelle, le même pays,
   une communauté commune et les relations communes, avec le motif affiché
   pour chaque suggestion.
5. **Projets (§21)** : le formulaire de création n'exposait que nom/
   description/visibilité alors que le cahier liste aussi objectif,
   localisation, domaine, besoins, budget indicatif, partenaires — tous
   existaient en base sans être accessibles. Complété. Filtre « Projets
   auxquels je peux contribuer » ajouté (projets ouverts au réseau avec des
   besoins exprimés, hors projets dont on est déjà propriétaire).
6. **Confidentialité (§31)** : les 5 réglages fins (e-mail/téléphone/ville/
   parcours JEC/parcours professionnel × Public/Membres/Connexions/Privé)
   existaient en base depuis une passe précédente mais n'étaient exposés
   nulle part dans l'interface. Ajoutés dans Paramètres.
7. **Profil professionnel (§7)** : ajout d'une section « Parcours
   professionnel » (nouvelle table `professionalExperiences`, distincte du
   parcours JEC) couvrant expériences, formation et certifications/diplômes.
   Ajout des champs langues, compétences, certifications, centres d'intérêt
   professionnels. Les 4 disponibilités (mentorat, collaboration, expertise,
   accompagnement de projet) et les sujets de mentorat, déjà en base,
   sont désormais éditables depuis le profil.

Migration Drizzle incrémentale générée : `drizzle/0002_mysterious_squadron_supreme.sql`
(purement additive — nouvelle table, nouvelles colonnes nullables ou à
valeur par défaut). À appliquer avec `npm run db:push`.

Vérifications refaites : `npm run check` (0 erreur), `npm run build` (OK),
`npx vitest run` (4/4).

### Ce qui reste identifié mais non traité dans ce lot
- **Carte du réseau (§12)** : le composant `Map.tsx` existe mais n'est
  branché à aucune page ni route ; nécessite une clé Google Maps
  (`VITE_GOOGLE_MAPS_API_KEY`) non fournie. Reporté volontairement plutôt que
  bâclé.
- **Recommandations algorithmiques (§42)** : le principe « Vous connaissez
  peut-être » est fait pour les connexions ; les mêmes critères (structure,
  pays, compétences, communauté) ne sont pas encore appliqués comme
  recommandations pour les mentors, projets ou opportunités.
- **Filtre « compétences »** dans l'annuaire (§11) : les filtres actuels
  couvrent nom, structure, statut JEC, pays, disponibilité mentorat ; pas
  encore de recherche par compétence déclarée (le champ existe en JSON,
  filtrage à ajouter).

## Mise à jour — retours utilisateur du 20 septembre 2026 (4ᵉ lot)

1. **Filtres mobiles harmonisés** : `Directory.tsx` (Annuaire) utilisait un
   système de filtre mobile « maison », dupliqué de celui déjà utilisé côté
   administration (`MobileQueryBar` + `MobileFilterSheet` dans
   `MobileQueryControls.tsx`). Refactorisé pour utiliser ce composant
   partagé, qui devient la référence commune. `Mentorship.tsx` (filtres
   domaine/pays/langue) utilise désormais le même composant. Les filtres à
   choix unique qui s'empilaient sur plusieurs lignes sur mobile
   (Événements, Opportunités, Communautés, Projets) défilent maintenant sur
   une seule ligne, sur le même principe que les onglets de la fiche
   communauté.
2. **Page détail d'un projet** : le bouton « Accéder » n'ouvrait rien
   (simple message temporaire). Nouvelle page `ProjectDetail.tsx`
   (`/projets/:id`) : image ou vidéo de couverture, objectif, besoins,
   domaine, localisation, budget indicatif, partenaires, lien externe,
   liste des membres, rejoindre/quitter un espace ouvert au réseau.
3. **Photo / vidéo / lien sur toutes les créations** : nouveau composant
   partagé `MediaAndLinkFields.tsx`, ajouté aux formulaires de création
   de : Mémoire JEC (photo/vidéo + lien vers une archive), Voir-Juger-Agir
   (photo/vidéo + lien vers une ressource), Projets (image/vidéo de
   couverture + lien du projet), Communautés (image). Les événements
   avaient déjà une image ; le lien d'inscription externe existait aussi.
   Schéma de données étendu en conséquence
   (`projects.coverStorageKey/coverMimeType/linkUrl`,
   `vjaSheets.mediaStorageKey/mediaMimeType/linkUrl`,
   `memoryEntries.linkUrl`).

Migration Drizzle incrémentale générée : `drizzle/0003_clammy_serpent_society.sql`
(purement additive — colonnes nullables ajoutées). À appliquer avec
`npm run db:push`.

Vérifications refaites : `npm run check` (0 erreur), `npm run build` (OK),
`npx vitest run` (4/4).

## Mise à jour — retours utilisateur du 21 septembre 2026 (5ᵉ lot : messagerie WhatsApp + profils cliquables)

1. **Nom de l'expéditeur dans les discussions de groupe/communauté** :
   déjà présent pour les groupes de structure, ajouté pour les communautés
   (`CommunityChatTab` ne l'affichait pas du tout). Le nom est désormais
   aussi cliquable vers le profil de l'expéditeur.
2. **« Infos sur le message » (qui a reçu/lu/pas lu)** : nouveau composant
   partagé `MessageReceiptsModal.tsx`. Cliquer sur n'importe quel message
   d'un groupe (structure ou communauté) ouvre la liste des membres classés
   « Lu » / « Pas encore lu », à partir du curseur de lecture
   (`conversationMembers.lastReadMessageId`) déjà utilisé pour les compteurs
   de messages non lus. Dans une messagerie sans notifications push, la
   « réception » correspond à l'appartenance au groupe ; la distinction
   pertinente et fiable est donc lu / pas lu.
3. **Accusés de réception façon WhatsApp en messages privés** : un coche
   quand le message est envoyé, deux coches quand le destinataire est
   connecté, deux coches colorées quand il a lu le message. Ceci a demandé
   une nouvelle notion de présence : `users.lastActiveAt`, mise à jour
   automatiquement (au plus une fois toutes les 30s) à chaque requête
   authentifiée, et un seuil de 2 minutes pour considérer un membre
   « connecté ». C'est une présence approximative par activité API, pas un
   système de présence temps réel par WebSocket — suffisant pour ce cas
   d'usage, mais moins précis qu'un vrai statut « en ligne » poussé en
   direct.
4. **Cliquer sur une photo ou un nom pour voir le profil, partout** :
   nouvelle page `PublicProfile.tsx` (route `/profil/:id`, distincte de
   `/profil` qui reste le profil de l'utilisateur connecté), et un nouveau
   composant partagé `ProfileLink`. Branché sur : l'annuaire, le fil
   d'actualité (auteur des publications et des commentaires), le réseau
   (connexions, demandes, suggestions), la messagerie (liste des
   conversations, en-tête de discussion, sélecteur de contact), le
   mentorat, Voir-Juger-Agir, les groupes de structure et de communauté
   (membres et expéditeurs de messages).
5. **Bug de création de projet depuis une communauté** : le code
   applicatif était correct (les 17 colonnes envoyées correspondent
   exactement au schéma) — l'erreur venait très probablement de la
   migration `0003` (colonnes `coverStorageKey`/`coverMimeType`/`linkUrl`)
   non appliquée à la base locale, comme lors d'un précédent incident
   similaire. Voir l'étape de vérification donnée dans la conversation.

Migration Drizzle incrémentale générée : `drizzle/0004_mushy_giant_man.sql`
(ajoute uniquement `users.lastActiveAt`, nullable). À appliquer avec
`npm run db:push`.

Vérifications refaites : `npm run check` (0 erreur), `npm run build` (OK),
`npx vitest run` (4/4).

### Limites assumées sur ce lot
- La présence "connecté" est approximative (activité API récente), pas un
  système de présence temps réel.
- Le middleware de présence effectue une écriture en base par utilisateur
  actif au plus toutes les 30 secondes ; c'est un compromis raisonnable pour
  ce volume d'utilisateurs, mais pas conçu pour une charge massive.
- Les profils cliquables n'ont pas été ajoutés dans l'administration
  (`AdminMembers.tsx` reste tel quel, contexte différent).

## Ce qui reste à faire avant une mise en production


1. **Décision de migration de données réelle** (cahier §35) : cette passe a
   généré une migration Drizzle **de base neuve**, pas un script de
   migration incrémental depuis un schéma CSPP en production. Si une base
   CSPP réelle existe déjà avec des données, il faut écrire un script de
   migration dédié (mapping `alumniProfiles → jecProfiles`,
   `promotions → organizationalUnits`, etc.) avant d'appliquer ce nouveau
   schéma. Les anciennes migrations CSPP n'ont pas été supprimées de
   l'historique Git (uniquement retirées du dossier `drizzle/` de ce ZIP).
2. **Internationalisation (§40)** : aucun système i18n n'a été mis en place.
   Tous les textes restent en dur en français.
3. **Carte du réseau géolocalisée (§12)** : le composant `Map.tsx` existe
   mais n'est branché à aucune page ; nécessite une clé Google Maps
   (`VITE_GOOGLE_MAPS_API_KEY`) non fournie.
4. **SEO des pages publiques (§48)** et **section Assistant IA (§43)** : hors
   périmètre de cette passe (explicitement phase future dans le cahier).
5. **Contenu de démonstration** (`client/src/data/mockData.ts`,
   `adminData.ts`) : nettoyé des mentions CSPP mais toujours des données
   fictives génériques — à remplacer par du vrai contenu JECI avant mise en
   ligne publique.
6. **Tests fonctionnels étendus (§49)** : seuls les 2 fichiers de tests déjà
   présents ont été conservés ; aucun nouveau test n'a été écrit pour les
   fonctionnalités ajoutées depuis (organisation, communautés, VJA, mémoire,
   mentorat, projets, filtres, médias).
7. **Exécution en conditions réelles** : les vérifications sont limitées à
   la compilation statique, au build et aux tests unitaires. L'utilisateur
   valide manuellement en local avec MariaDB à chaque livraison.
8. **Recommandations algorithmiques élargies (§42)** : « Vous connaissez
   peut-être » fonctionne pour les connexions ; les mêmes critères ne sont
   pas encore appliqués pour suggérer des mentors, projets ou opportunités.
9. **Filtre « compétences »** dans l'annuaire (§11) : pas encore de
   recherche par compétence déclarée (le champ existe en JSON, filtrage à
   ajouter).
10. **Page d'accueil publique (§39)** : aucune page de présentation publique
    séparée n'existe ; un visiteur non connecté est redirigé vers la
    connexion.
