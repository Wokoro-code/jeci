# JEC Network — Référentiel des rôles et droits

**Statut : validé pour la conception backend**  
**Portée : espace Alumni, messagerie et interface d’administration**  
**Objectif : fournir la règle de référence pour les permissions du futur backend.**

## 1. Principes directeurs

L’accès doit suivre le **principe du moindre privilège** : chaque personne obtient uniquement les permissions nécessaires à son usage réel. Les permissions ne sont pas accordées par écran, mais par domaine métier et par action. Une même personne peut être à la fois alumni et mentor ; le rôle **Mentor** est alors un complément au rôle Alumni, et non un remplacement.

> Aucun rôle, y compris Administrateur, ne doit donner un accès général au contenu privé des conversations. L’accès exceptionnel à un message privé doit être motivé par un signalement, limité au périmètre concerné et journalisé.

| Rôle | Positionnement | Attribution | Accès principal |
| --- | --- | --- | --- |
| **Alumni** | Membre du réseau JEC, avec un statut de vérification distinct. | Compte créé, puis vérification administrative. | Consultation complète du réseau dès la création ; interactions ouvertes après vérification. |
| **Mentor** | Alumni disponible pour accompagner d’autres membres. | Activation immédiate dès la déclaration de disponibilité par un alumni vérifié. | Tous les droits Alumni, complétés par la gestion de son offre de mentorat et de ses binômes. |
| **Modérateur** | Membre habilité à maintenir un espace sûr et conforme à la charte. | Désigné par un administrateur. | File de signalements, décisions de modération limitées, suivi d’escalade. |
| **Administrateur** | Responsable de l’exploitation et du référentiel JEC. | Désigné par un administrateur habilité. | Gestion des membres, promotions, contenus, événements, opportunités, programmes et paramètres. |

## 2. Statuts du compte Alumni et badge de certification

Le rôle **Alumni** est accessible dès la création du compte. Il comporte deux statuts qui déterminent les droits d’interaction. Le passage au statut vérifié est automatique dès que l’administration approuve le compte ; aucune action supplémentaire n’est requise de la part de l’alumni.

| Statut | Visibilité et consultation | Interactions | Indicateur de profil |
| --- | --- | --- | --- |
| **En cours de validation** | Accès à son profil, au fil de publications, à l’annuaire, aux opportunités, aux événements, aux promotions, au mentorat, aux projets et aux paramètres. | Aucune interaction : pas de publication, commentaire, réaction, demande de connexion, message, inscription active, candidature ou création de groupe. | Libellé **« En cours de validation »** à la place du badge bleu. |
| **Vérifié** | Même accès de consultation. | Tous les droits Alumni décrits dans la matrice : publication, réaction, commentaire, connexion, messagerie, inscription et participation. | **Badge bleu de certification** visible sur le profil et dans les contextes où l’identité est affichée. |

> La visibilité ne dépend pas de la validation. La validation protège exclusivement les actions susceptibles de créer du contenu, de contacter un autre membre, de modifier une donnée partagée ou de produire un engagement au sein du réseau.

### Exigences d’interface et de backend

| Élément | Règle à appliquer |
| --- | --- |
| Profil non vérifié | Afficher « En cours de validation » de façon explicite ; ne jamais afficher le badge bleu. |
| Profil vérifié | Afficher le badge bleu de certification dans l’en-tête de profil, les cartes d’annuaire, les publications, les commentaires, les messages et les listes de mentorat lorsque le profil apparaît. |
| Action non autorisée | L’action peut être visible afin d’expliquer le produit, mais doit être désactivée ou ouvrir un message expliquant que la vérification est requise. |
| Contrôle backend | Toute mutation doit vérifier `accountStatus = verified` côté serveur ; masquer une action dans le frontend ne suffit pas. |
| Validation / refus | L’administrateur valide, refuse ou demande un complément. Tout changement doit être journalisé et notifié à l’alumni. |

## 3. Légende de la matrice

| Symbole | Signification |
| --- | --- |
| **L** | Lire ou consulter. |
| **C** | Créer. |
| **M** | Modifier. |
| **S** | Supprimer, masquer ou archiver. |
| **G** | Gérer au niveau du domaine métier. |
| **—** | Aucune permission. |

Les droits marqués « propres » portent uniquement sur les données de l’utilisateur. Les droits « assignés » sont limités aux éléments confiés au rôle. Les droits de gestion sont exercés dans l’interface d’administration.

## 4. Matrice des droits fonctionnels

Dans cette matrice, chaque droit d’interaction indiqué dans la colonne **Alumni** ou **Mentor** s’applique uniquement au statut **Vérifié**. Pour un statut **En cours de validation**, seuls les droits de lecture et de gestion du profil personnel restent ouverts, conformément à la section 2.

| Domaine | Alumni | Mentor | Modérateur | Administrateur |
| --- | --- | --- | --- | --- |
| **Profil et confidentialité** | L, M ses données et préférences. | L, M ses données et disponibilité mentor. | L son profil. | L, M données de profil nécessaires à l’administration ; suspension et désactivation. |
| **Annuaire** | L des profils rendus visibles ; filtrer et contacter ses connexions. | Idem Alumni. | L. | G visibilité, statut de vérification, export encadré. |
| **Connexions** | C, L, M, S ses invitations et connexions. | Idem Alumni. | L uniquement si nécessaire à une enquête. | G en cas de fraude ou de litige documenté. |
| **Publications et commentaires** | C, L, M, S ses contenus ; signaler les contenus tiers. | Idem Alumni. | L éléments signalés ; masquer temporairement, classer, escalader. | G contenus, catégories, règles et décisions finales. |
| **Messagerie** | C, L, M, S ses conversations ; échanger avec ses connexions. | Idem Alumni. | Aucun accès au contenu privé ; L du message concerné uniquement lors d’un signalement autorisé. | Aucun accès de consultation courante ; accès exceptionnel au contenu signalé, sur justification et journalisation. |
| **Fichiers de messagerie** | C, L, S sur ses fichiers et conversations autorisées. | Idem Alumni. | L du seul fichier signalé lorsqu’une enquête le requiert. | G rétention et retrait d’un fichier illicite signalé, jamais navigation libre. |
| **Opportunités** | L ; C une proposition ; M, S ses propres offres tant qu’elles ne sont pas closes. | Idem Alumni. | L des offres signalées. | G validation, publication, expiration, archivage et statistiques. |
| **Événements** | L ; C une proposition ; inscription et annulation personnelles. | Idem Alumni. | L des événements signalés. | G création, validation, inscriptions, annulations et communications. |
| **Promotions** | L de sa promotion et des promotions publiques ; participation aux espaces autorisés. | Idem Alumni. | L si la mission le nécessite. | G cohortes, responsables, visibilité et statistiques. |
| **Mentorat** | L les mentors ; C une demande ; M, S ses demandes. | C, L, M son offre ; accepter/refuser les demandes assignées ; gérer ses rendez-vous. | L des dossiers signalés ou escaladés. | G programme, disponibilité, appariements et résolution de litiges. |
| **Projets et groupes** | L ; C et M ses espaces selon règles ; gérer les membres de ses propres groupes. | Idem Alumni. | L des groupes signalés. | G visibilité, archivage et retrait d’un contenu ou groupe non conforme. |
| **Signalements** | C et L ses propres signalements. | Idem Alumni. | L, M statut ; classer, demander contexte, masquer temporairement, escalader. | G toute la file, décisions finales, paramétrage des motifs et réouverture. |
| **Communications officielles** | L et préférences de réception. | Idem Alumni. | — | C, L, M, S campagnes, segments autorisés et modèles. |
| **Paramètres de la plateforme** | — | — | L de la charte et des procédures. | G paramètres métier, règles de modération, catégories et paramètres de sécurité non techniques. |
| **Rôles et permissions** | — | — | — | G, avec journal d’audit et confirmation renforcée. |

## 5. Règles de validation et d’escalade

La vérification d’appartenance au JEC est une décision administrative. Un Alumni en attente accède au réseau en lecture complète et peut compléter ses justificatifs ; il ne peut pas interagir avec les contenus, demander une connexion, écrire un message ou s’inscrire de façon active tant que son compte n’est pas validé.

| Situation | Première décision | Escalade / décision finale |
| --- | --- | --- |
| Nouveau compte ou justificatif | Administrateur : valider, refuser ou demander un complément. | Second administrateur pour les cas ambigus ou sensibles. |
| Contenu public signalé | Modérateur : conserver, masquer temporairement ou escalader. | Administrateur : retrait définitif, suspension ou classement. |
| Signalement de message privé | Modérateur habilité : accès limité au contenu signalé. | Administrateur : décision, notification et conservation de preuve. |
| Conflit de mentorat | Modérateur : recueil de contexte et suspension temporaire du binôme si nécessaire. | Administrateur : réaffectation, clôture ou sanction. |
| Modification de rôle | Administrateur habilité : attribution ou retrait avec justification. | Confirmation renforcée et journalisation ; un seul administrateur habilité suffit au démarrage. |
| Suppression ou suspension de compte | Administrateur : suspension réversible en premier niveau. | Suppression définitive soumise à la politique de rétention et aux obligations légales. |

## 6. Actions sensibles et exigences de sécurité

Les actions suivantes doivent être confirmées dans l’interface et protégées côté serveur. Elles ne doivent jamais reposer uniquement sur le masquage d’un bouton frontend.

| Action | Autorisation minimale | Garde-fous requis |
| --- | --- | --- |
| Retirer ou masquer un contenu | Modérateur pour masquage temporaire ; Administrateur pour retrait définitif. | Confirmation, motif, notification de l’auteur, décision réversible lorsque possible. |
| Voir un message privé signalé | Modérateur habilité ou Administrateur. | Justification, accès limité à l’élément signalé, journalisation obligatoire. |
| Suspendre un membre | Administrateur. | Confirmation, motif, durée ou condition de réexamen, notification. |
| Attribuer Modérateur ou Administrateur | Administrateur habilité. | Confirmation renforcée et journalisation ; un seul administrateur habilité suffit au démarrage. |
| Exporter des données membres | Administrateur habilité. | Finalité explicite, portée minimale, export horodaté et journalisé. |
| Modifier les règles de modération ou la rétention | Administrateur habilité. | Journal d’audit, versionnage et possibilité de retour arrière. |

## 7. Journal d’audit minimal

Le backend doit enregistrer : l’auteur, le rôle utilisé, l’action, la ressource concernée, l’horodatage, le motif lorsque requis, l’état avant/après et le résultat. Les journaux ne doivent pas contenir le texte intégral d’une conversation privée hors cas de signalement explicitement traité.

Les permissions sont évaluées côté serveur à chaque requête sensible. Le frontend peut améliorer l’expérience en cachant les actions indisponibles, mais il ne constitue jamais la barrière d’autorisation.

## 8. Décisions validées

La règle de validation des comptes est intégrée au référentiel : **lecture immédiate, interactions après vérification, badge bleu uniquement après validation**. Les règles de gouvernance suivantes sont également validées pour le démarrage.

| Décision | Règle retenue |
| --- | --- |
| Activation Mentor | Un alumni vérifié devient Mentor immédiatement lorsqu’il déclare sa disponibilité ; aucune validation administrative préalable n’est requise. |
| Pouvoir du Modérateur | Le Modérateur peut conserver, classer, demander un complément, masquer temporairement ou escalader. Le retrait définitif reste exclusivement du ressort de l’Administrateur. |
| Attribution Administrateur | Un Administrateur habilité peut attribuer ou retirer le rôle Administrateur au démarrage. L’action reste confirmée et journalisée. |
