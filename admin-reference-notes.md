# Notes de référence — administration JEC Network

## Maquettes analysées

### Tableau de bord

La maquette présente un portail administratif sobre et institutionnel. La sidebar desktop reste blanche et structurée autour du profil administrateur, tandis que la barre haute accueille la recherche, les alertes, l’aide et le compte. Le contenu utilise un fond gris-bleu très clair, une hiérarchie éditoriale sérif et des cartes blanches bordées.

Le tableau de bord priorise les indicateurs opérationnels : alumni vérifiés, dossiers en attente, publications signalées et événements à valider. Une colonne « Actions requises » met en avant les éléments urgents ; le reste de la surface est consacré à une courbe d’évolution des inscriptions.

### Gestion des alumni

La page de gestion s’appuie sur une barre de filtres structurée, une table lisible et des statuts immédiatement repérables. Les actions contextuelles sont compactes, afin de laisser le registre de données dominer. L’interface doit conserver ce niveau d’exigence tout en ajoutant des détails de production : recherche, filtres persistants, pagination, menus d’actions et confirmations pour les opérations sensibles.

## Implications pour l’implémentation

| Sujet | Décision |
| --- | --- |
| Identité | Réutiliser le duo DM Sans / EB Garamond, le bleu nuit et l’or de promotion JEC, dans un registre plus analytique que l’espace membre. |
| Navigation | Mettre en place une coque administrateur dédiée, avec sidebar, barre haute, version mobile et raccourcis d’actions. |
| Données | Utiliser des modèles mockés explicitement séparés des composants afin de préparer les futurs adaptateurs API. |
| Écrans | Prévoir tableau de bord, alumni, vérifications, promotions, publications, opportunités, mentorat, événements, signalements, communications et paramètres. |
| Sécurité UX | Pour les actions à risque, afficher un état de confirmation et des retours de démonstration ; l’autorisation serveur viendra lors de la phase backend. |
