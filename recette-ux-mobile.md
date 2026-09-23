# Recette UX mobile — JEC Network

**Périmètre.** Cette recette porte sur les parcours membres et administration à une largeur de 375 px, sans action de modification du code. Elle vérifie la lisibilité, le défilement, les navigations persistantes, les recherches et filtres, les ouvertures de détail, les actions de formulaire et les états d’interface.

## Échelle de criticité

| Niveau | Définition |
| --- | --- |
| Bloquant | Empêche d’achever un parcours principal. |
| Majeur | Dégrade fortement la compréhension, la navigation ou la confiance. |
| Modéré | Crée une friction visible, sans empêcher l’action. |
| Mineur | Amélioration de cohérence, de libellé ou de finition. |

## Parcours à auditer

| Espace | Parcours |
| --- | --- |
| Alumni | Accueil, annuaire, promotions, opportunités, mentorat, événements, messagerie, profil, enregistrements, projets, paramètres et détail d’événement. |
| Administration | Tableau de bord, alumni, vérifications, promotions, publications, opportunités, mentorat, projets, événements, signalements, communications, paramètres et création d’opportunité. |

## Registre des observations

| ID | Écran / parcours | Observation | Criticité | Recommandation | Statut |
| --- | --- | --- | --- | --- | --- |
| UXM-01 | Alumni — Messagerie, liste des conversations | Avec seulement quatre conversations mockées, le conteneur conserve une grande zone blanche imposée par une hauteur minimale ; la liste paraît inachevée et ralentit la lecture du point d’entrée. | Modéré | Hauteur minimale desktop conservée ; la liste mobile s’ajuste désormais au contenu. | Corrigé |
| UXM-02 | Alumni — Annuaire, opportunités, événements | Les contrôles fixes sous le header sont cohérents, lisibles et n’obstruent pas le premier élément de résultat dans les vues inspectées. | — | Conserver ce modèle pour les futurs écrans de recherche. | Validé |
| UXM-03 | Alumni — Détail d’événement | Le retour vers la liste, l’image, les informations pratiques et l’action d’inscription sont hiérarchisés de manière compréhensible sur mobile. | — | Conserver cette organisation comme référence pour les futurs détails éditoriaux. | Validé |
| UXM-04 | Alumni — Paramètres | Les interrupteurs sont visuellement identifiables, mais aucun retour persistant n’indique la sauvegarde des préférences tant que le backend n’est pas relié. | Mineur | Prévoir des retours de succès et une persistance optimiste lors du branchement API. | À prévoir avec le backend |
| UXM-05 | Administration — Signalements | Les filtres « Tous / Critique / À examiner » restent placés dans le flux de la page. Ils disparaissent lors du défilement, contrairement au standard mobile adopté pour les autres files de gestion. | Majeur | Déclencheur fixe et panneau de filtres superposé appliqués en mobile. | Corrigé |
| UXM-06 | Administration — En-tête mobile | L’en-tête réduit à menu, alerte et avatar ne rappelle pas explicitement que l’utilisateur se trouve dans l’administration. | Mineur | Repère « Admin » ajouté près du menu, uniquement sur mobile. | Corrigé |
| UXM-07 | Administration — Opportunités, création | L’action « Créer une opportunité » de la liste ne conduit pas au formulaire de création existant ; elle affiche seulement une information temporaire. | Majeur | Action reliée au formulaire `/admin/opportunities/new`. | Corrigé |
| UXM-08 | Administration — Signalements, retrait | Une action de retrait de contenu est visible dans chaque carte sans confirmation perceptible dans le parcours inspecté. | Majeur | Une confirmation précise les conséquences avant le retrait. | Corrigé |
| UXM-09 | Administration — Paramètres et création d’opportunité | Les formulaires mobiles sont lisibles, structurés et adaptés à la largeur de l’écran ; les actions finales restent visibles après lecture. | — | Conserver cette hiérarchie pour les futurs formulaires administratifs. | Validé |
| UXM-10 | Application — stabilité technique | Aucun message d’erreur applicatif n’a été relevé dans les journaux pendant l’inspection visuelle ; seules des informations de développement sont présentes. | — | Rejouer les scénarios d’interaction sur appareils réels avant mise en production. | Validé |

## Synthèse de recette

L’expérience mobile est désormais **cohérente dans ses fondations** : l’identité JEC reste lisible, les listes sont adaptées à la largeur mobile, les recherches et filtres sont normalisés, et les sélections clés — messagerie, opportunités et vérifications — s’ouvrent dans des écrans de détail avec retour explicite. Aucun défaut bloquant de rendu ni erreur applicative n’a été identifié durant l’inspection.

Les points restants sont concentrés dans les **parcours administrateur** et dans les actions qui deviendront sensibles en production. Ils sont suffisamment précis pour être corrigés lors d’un prochain lot ciblé, avant de démarrer le backend.

## Priorités recommandées

| Priorité | Correctif | Justification |
| --- | --- | --- |
| P1 | UXM-05 — Normaliser les filtres de la page Signalements. | La page déroge au modèle mobile déjà adopté : ses critères disparaissent pendant le défilement. |
| P1 | UXM-07 — Relier « Créer une opportunité » au formulaire existant. | L’utilisateur rencontre un cul-de-sac malgré l’existence de l’écran de création. |
| P1 | UXM-08 — Ajouter une confirmation de retrait ou de masquage. | Une action destructive doit être explicitement confirmée et expliquer sa conséquence. |
| P2 | UXM-01 — Réduire l’espace vide de la liste de conversations. | Le premier écran de messagerie serait plus dense et plus crédible avec peu de conversations. |
| P2 | UXM-06 — Ajouter un repère « Administration » dans l’en-tête mobile. | Cela renforce l’orientation lorsque la sidebar est fermée. |
| P3 | UXM-04 — Préparer les retours de sauvegarde persistants. | Ce comportement sera pleinement utile une fois les préférences connectées au backend. |

## Limites de la recette

La recette a couvert les écrans rendus à une largeur de **375 px**, le défilement visuel, les structures de navigation et les scénarios de sélection matérialisés dans le frontend. Avant une publication, il restera pertinent de rejouer les actions tactiles sur appareils physiques, notamment les modales, les confirmations destructives, les champs de formulaire, le clavier virtuel et les retours système.

## Décision de passage

> Le frontend mobile peut passer à un dernier lot de correctifs UX ciblés. Il est préférable de traiter les trois correctifs P1 avant d’engager l’intégration du backend, afin de ne pas figer des flux administrateur incomplets.
