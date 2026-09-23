import { boolean, date, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/** Identity remains compatible with the original OAuth flow; JEC roles and verification are modeled separately. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"), email: varchar("email", { length: 320 }), loginMethod: varchar("loginMethod", { length: 64 }),
  // Authentification locale par mot de passe (hash bcrypt). Nul pour les comptes créés uniquement via un flux externe.
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  accountStatus: mysqlEnum("accountStatus", ["pending_verification", "verified", "rejected", "suspended", "deactivated"]).default("pending_verification").notNull(),
  emailVerifiedAt: timestamp("emailVerifiedAt"), verifiedAt: timestamp("verifiedAt"),
  // Présence approximative (cahier messagerie : accusés de type WhatsApp), mise à jour à chaque requête authentifiée.
  lastActiveAt: timestamp("lastActiveAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(), lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => [index("users_status_idx").on(table.accountStatus), uniqueIndex("users_email_unique").on(table.email)]);

// --- Architecture organisationnelle JECI (cahier des charges §5) ---
// Une seule table auto-référencée plutôt que 5 tables rigides : chaque
// mouvement national reste libre de définir sa propre profondeur de
// hiérarchie (diocèse, région, secteur, université, paroisse, etc.) sans
// modification de schéma. `level` sert uniquement à l'affichage / aux
// filtres, `parentId` porte la hiérarchie réelle.
export const organizationalUnits = mysqlTable("organizationalUnits", {
  id: int("id").autoincrement().primaryKey(),
  parentId: int("parentId"),
  level: mysqlEnum("level", ["international", "regional", "national", "local", "group"]).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  // Libellé du type de structure locale (Diocèse, Secteur, Université...) — laissé libre car non harmonisé entre mouvements nationaux.
  localTypeLabel: varchar("localTypeLabel", { length: 80 }),
  description: text("description"),
  countryCode: varchar("countryCode", { length: 2 }),
  logoStorageKey: varchar("logoStorageKey", { length: 512 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("org_units_parent_idx").on(table.parentId), index("org_units_level_idx").on(table.level), index("org_units_country_idx").on(table.countryCode)]);

// --- Profil JEC (remplace alumniProfiles) ---
export const jecProfiles = mysqlTable("jecProfiles", {
  userId: int("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  // Structure de rattachement actuelle (groupe/équipe le plus souvent).
  unitId: int("unitId").references(() => organizationalUnits.id),
  firstName: varchar("firstName", { length: 100 }), lastName: varchar("lastName", { length: 100 }),
  headline: varchar("headline", { length: 180 }),
  // Statut JEC déclaré (cahier §9) — distinct du statut de vérification du compte.
  jecStatus: mysqlEnum("jecStatus", ["active_jeciste", "alumni_jeciste", "former_leader", "current_leader", "chaplain", "facilitator", "volunteer", "supporter"]).default("alumni_jeciste").notNull(),
  // Volet professionnel (distinct du parcours JEC, voir jecExperiences).
  organization: varchar("organization", { length: 180 }), jobTitle: varchar("jobTitle", { length: 180 }), sector: varchar("sector", { length: 120 }),
  bio: text("bio"), country: varchar("country", { length: 100 }), city: varchar("city", { length: 120 }),
  languages: json("languages"), skills: json("skills"),
  // Certifications et centres d'intérêt professionnels (cahier §7).
  certifications: json("certifications"), interests: json("interests"),
  website: varchar("website", { length: 300 }), socialLinks: json("socialLinks"),
  avatarStorageKey: varchar("avatarStorageKey", { length: 512 }), coverStorageKey: varchar("coverStorageKey", { length: 512 }),
  directoryVisibility: mysqlEnum("directoryVisibility", ["network", "unit_only", "private"]).default("network").notNull(),
  mentorAvailable: boolean("mentorAvailable").default(false).notNull(), mentorTopics: json("mentorTopics"),
  // Disponibilités complémentaires (cahier §7).
  availableForCollaboration: boolean("availableForCollaboration").default(false).notNull(),
  availableAsExpert: boolean("availableAsExpert").default(false).notNull(),
  availableForProjects: boolean("availableForProjects").default(false).notNull(),
  // Confidentialité fine (cahier §31) : visibilité par champ.
  privacyEmail: mysqlEnum("privacyEmail", ["public", "members", "connections", "private"]).default("connections").notNull(),
  privacyPhone: mysqlEnum("privacyPhone", ["public", "members", "connections", "private"]).default("private").notNull(),
  privacyCity: mysqlEnum("privacyCity", ["public", "members", "connections", "private"]).default("members").notNull(),
  privacyJecPath: mysqlEnum("privacyJecPath", ["public", "members", "connections", "private"]).default("public").notNull(),
  privacyProfessionalPath: mysqlEnum("privacyProfessionalPath", ["public", "members", "connections", "private"]).default("public").notNull(),
  phone: varchar("phone", { length: 40 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("jec_profiles_unit_idx").on(table.unitId), index("jec_profiles_mentor_idx").on(table.mentorAvailable), index("jec_profiles_status_idx").on(table.jecStatus)]);

// --- Parcours professionnel : expériences, formation, diplômes (cahier §7) — distinct du parcours JEC ---
export const professionalExperiences = mysqlTable("professionalExperiences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: mysqlEnum("kind", ["work", "education", "certification"]).default("work").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  organization: varchar("organization", { length: 180 }),
  startDate: date("startDate"), endDate: date("endDate"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("professional_experiences_user_idx").on(table.userId, table.startDate)]);

// --- « Mon parcours JEC » (cahier §8) — distinct du CV professionnel ---
export const jecExperiences = mysqlTable("jecExperiences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  unitId: int("unitId").references(() => organizationalUnits.id),
  // Saisie libre si la structure n'existe pas encore dans le référentiel.
  movementLabel: varchar("movementLabel", { length: 160 }),
  functionTitle: varchar("functionTitle", { length: 160 }).notNull(),
  startDate: date("startDate"), endDate: date("endDate"),
  description: text("description"), responsibilities: text("responsibilities"),
  createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("jec_experiences_user_idx").on(table.userId, table.startDate), index("jec_experiences_unit_idx").on(table.unitId)]);

// --- Communautés (cahier §15) ---
export const communities = mysqlTable("communities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  imageStorageKey: varchar("imageStorageKey", { length: 512 }),
  scope: mysqlEnum("scope", ["international", "regional", "national", "professional", "thematic"]).default("thematic").notNull(),
  // Rattachement géographique/organisationnel optionnel (ex : communauté nationale liée à JEC Togo).
  unitId: int("unitId").references(() => organizationalUnits.id),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("communities_scope_idx").on(table.scope), index("communities_unit_idx").on(table.unitId)]);

export const communityMembers = mysqlTable("communityMembers", {
  communityId: int("communityId").notNull().references(() => communities.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["admin", "member"]).default("member").notNull(),
  // Adhésion soumise à validation par un administrateur de la communauté (demande sur demande de l'utilisateur métier).
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("approved").notNull(),
  respondedBy: int("respondedBy").references(() => users.id),
  respondedAt: timestamp("respondedAt"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("community_member_unique").on(table.communityId, table.userId), index("community_members_user_idx").on(table.userId), index("community_members_status_idx").on(table.communityId, table.status)]);

// --- Documents partagés d'une communauté (cahier §15) ---
export const communityDocuments = mysqlTable("communityDocuments", {
  id: int("id").autoincrement().primaryKey(),
  communityId: int("communityId").notNull().references(() => communities.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  uploadedBy: int("uploadedBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("community_documents_community_idx").on(table.communityId)]);

// --- RBAC (cahier §28) : rôles applicatifs + périmètre d'exercice ---
export const roles = mysqlTable("roles", { id: int("id").autoincrement().primaryKey(), code: mysqlEnum("code", ["member", "mentor", "moderator", "verification_officer", "community_admin", "local_admin", "national_admin", "regional_admin", "international_admin", "super_admin"]).notNull().unique(), label: varchar("label", { length: 80 }).notNull() });
export const userRoles = mysqlTable("userRoles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: int("roleId").notNull().references(() => roles.id),
  // Périmètre d'exercice du rôle : global (super_admin), une structure organisationnelle (national/regional/local_admin) ou une communauté (community_admin). Pas de contrainte FK typée car la cible dépend de scopeType.
  scopeType: mysqlEnum("scopeType", ["global", "unit", "community"]).default("global").notNull(),
  scopeId: int("scopeId"),
  assignedBy: int("assignedBy").references(() => users.id), assignedAt: timestamp("assignedAt").defaultNow().notNull(), revokedAt: timestamp("revokedAt"), reason: varchar("reason", { length: 500 }),
}, (table) => [uniqueIndex("user_role_scope_unique").on(table.userId, table.roleId, table.scopeType, table.scopeId), index("user_roles_user_idx").on(table.userId)]);

export const verificationRequests = mysqlTable("verificationRequests", { id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }), status: mysqlEnum("status", ["submitted", "needs_information", "approved", "rejected"]).default("submitted").notNull(), decisionReason: text("decisionReason"), reviewedBy: int("reviewedBy").references(() => users.id), submittedAt: timestamp("submittedAt").defaultNow().notNull(), reviewedAt: timestamp("reviewedAt"), createdAt: timestamp("createdAt").defaultNow().notNull() }, (table) => [index("verification_queue_idx").on(table.status, table.submittedAt), index("verification_user_idx").on(table.userId)]);
export const verificationDocuments = mysqlTable("verificationDocuments", { id: int("id").autoincrement().primaryKey(), verificationRequestId: int("verificationRequestId").notNull().references(() => verificationRequests.id, { onDelete: "cascade" }), storageKey: varchar("storageKey", { length: 512 }).notNull(), originalName: varchar("originalName", { length: 255 }).notNull(), mimeType: varchar("mimeType", { length: 100 }).notNull(), uploadedAt: timestamp("uploadedAt").defaultNow().notNull() });

export const connections = mysqlTable("connections", { id: int("id").autoincrement().primaryKey(), userAId: int("userAId").notNull().references(() => users.id, { onDelete: "cascade" }), userBId: int("userBId").notNull().references(() => users.id, { onDelete: "cascade" }), initiatedById: int("initiatedById").notNull().references(() => users.id, { onDelete: "cascade" }), status: mysqlEnum("status", ["pending", "accepted", "declined", "blocked"]).default("pending").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), respondedAt: timestamp("respondedAt") }, (table) => [uniqueIndex("connection_pair_unique").on(table.userAId, table.userBId), index("connection_recipient_idx").on(table.userBId, table.status)]);

export const conversations = mysqlTable("conversations", { id: int("id").autoincrement().primaryKey(), kind: mysqlEnum("kind", ["direct", "group"]).default("direct").notNull(), directPairKey: varchar("directPairKey", { length: 40 }).unique(), unitId: int("unitId").references(() => organizationalUnits.id), communityId: int("communityId").references(() => communities.id), title: varchar("title", { length: 160 }), createdBy: int("createdBy").notNull().references(() => users.id), createdAt: timestamp("createdAt").defaultNow().notNull(), lastMessageAt: timestamp("lastMessageAt"), archivedAt: timestamp("archivedAt") }, (table) => [index("conversation_recent_idx").on(table.lastMessageAt), uniqueIndex("conversation_unit_unique").on(table.unitId), uniqueIndex("conversation_community_unique").on(table.communityId)]);
export const conversationMembers = mysqlTable("conversationMembers", { conversationId: int("conversationId").notNull().references(() => conversations.id, { onDelete: "cascade" }), userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }), joinedAt: timestamp("joinedAt").defaultNow().notNull(), leftAt: timestamp("leftAt"), lastReadMessageId: int("lastReadMessageId"), mutedAt: timestamp("mutedAt") }, (table) => [uniqueIndex("conversation_member_unique").on(table.conversationId, table.userId), index("conversation_member_user_idx").on(table.userId)]);
export const messages = mysqlTable("messages", { id: int("id").autoincrement().primaryKey(), conversationId: int("conversationId").notNull().references(() => conversations.id, { onDelete: "cascade" }), senderId: int("senderId").notNull().references(() => users.id), body: text("body"), kind: mysqlEnum("kind", ["text", "attachment", "voice", "system"]).default("text").notNull(), replyToId: int("replyToId"), sentAt: timestamp("sentAt").defaultNow().notNull(), editedAt: timestamp("editedAt"), deletedAt: timestamp("deletedAt") }, (table) => [index("messages_thread_idx").on(table.conversationId, table.sentAt), index("messages_sender_idx").on(table.senderId, table.sentAt)]);
export const messageAttachments = mysqlTable("messageAttachments", { id: int("id").autoincrement().primaryKey(), messageId: int("messageId").notNull().references(() => messages.id, { onDelete: "cascade" }), storageKey: varchar("storageKey", { length: 512 }).notNull(), originalName: varchar("originalName", { length: 255 }).notNull(), mimeType: varchar("mimeType", { length: 100 }).notNull(), sizeBytes: int("sizeBytes").notNull(), durationMs: int("durationMs"), thumbnailKey: varchar("thumbnailKey", { length: 512 }), createdAt: timestamp("createdAt").defaultNow().notNull() }, (table) => [index("message_attachment_idx").on(table.messageId), uniqueIndex("storage_key_unique").on(table.storageKey)]);
export const auditLogs = mysqlTable("auditLogs", { id: int("id").autoincrement().primaryKey(), actorId: int("actorId").references(() => users.id), actorRole: varchar("actorRole", { length: 32 }), action: varchar("action", { length: 120 }).notNull(), entityType: varchar("entityType", { length: 80 }).notNull(), entityId: varchar("entityId", { length: 80 }).notNull(), reason: text("reason"), before: json("before"), after: json("after"), requestId: varchar("requestId", { length: 80 }), ipHash: varchar("ipHash", { length: 128 }), occurredAt: timestamp("occurredAt").defaultNow().notNull() }, (table) => [index("audit_entity_idx").on(table.entityType, table.entityId), index("audit_actor_idx").on(table.actorId, table.occurredAt)]);

// --- Fil de publications ---
export const posts = mysqlTable("posts", { id: int("id").autoincrement().primaryKey(), authorId: int("authorId").notNull().references(() => users.id, { onDelete: "cascade" }), communityId: int("communityId").references(() => communities.id), body: text("body").notNull(), category: mysqlEnum("category", ["news", "testimony", "reflection", "project", "opportunity", "event", "training", "call_for_contribution", "skills_request", "volunteer_request"]).default("news").notNull(), visibility: mysqlEnum("visibility", ["network", "unit_only", "public"]).default("network").notNull(), attachmentStorageKey: varchar("attachmentStorageKey", { length: 512 }), attachmentMimeType: varchar("attachmentMimeType", { length: 100 }), createdAt: timestamp("createdAt").defaultNow().notNull(), editedAt: timestamp("editedAt"), hiddenAt: timestamp("hiddenAt"), hiddenReason: varchar("hiddenReason", { length: 500 }), deletedAt: timestamp("deletedAt") }, (table) => [index("posts_feed_idx").on(table.createdAt), index("posts_author_idx").on(table.authorId), index("posts_community_idx").on(table.communityId)]);
export const postComments = mysqlTable("postComments", { id: int("id").autoincrement().primaryKey(), postId: int("postId").notNull().references(() => posts.id, { onDelete: "cascade" }), authorId: int("authorId").notNull().references(() => users.id, { onDelete: "cascade" }), body: text("body").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), hiddenAt: timestamp("hiddenAt"), deletedAt: timestamp("deletedAt") }, (table) => [index("comments_post_idx").on(table.postId, table.createdAt)]);
export const postReactions = mysqlTable("postReactions", { id: int("id").autoincrement().primaryKey(), postId: int("postId").notNull().references(() => posts.id, { onDelete: "cascade" }), userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }), kind: mysqlEnum("kind", ["like", "celebrate", "support", "insightful"]).default("like").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull() }, (table) => [uniqueIndex("reaction_unique").on(table.postId, table.userId)]);
export const savedItems = mysqlTable("savedItems", { id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }), itemType: mysqlEnum("itemType", ["post", "opportunity", "event", "project"]).notNull(), itemId: int("itemId").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull() }, (table) => [uniqueIndex("saved_item_unique").on(table.userId, table.itemType, table.itemId)]);

// --- Signalements (modération) ---
export const reports = mysqlTable("reports", { id: int("id").autoincrement().primaryKey(), reporterId: int("reporterId").notNull().references(() => users.id, { onDelete: "cascade" }), targetType: mysqlEnum("targetType", ["post", "comment", "message", "profile", "opportunity", "event", "project"]).notNull(), targetId: int("targetId").notNull(), reason: varchar("reason", { length: 120 }).notNull(), details: text("details"), status: mysqlEnum("status", ["open", "under_review", "escalated", "resolved", "dismissed"]).default("open").notNull(), decision: varchar("decision", { length: 60 }), decisionReason: text("decisionReason"), handledBy: int("handledBy").references(() => users.id), createdAt: timestamp("createdAt").defaultNow().notNull(), resolvedAt: timestamp("resolvedAt") }, (table) => [index("reports_status_idx").on(table.status, table.createdAt), index("reports_target_idx").on(table.targetType, table.targetId)]);

// --- Opportunités ---
export const opportunities = mysqlTable("opportunities", { id: int("id").autoincrement().primaryKey(), authorId: int("authorId").notNull().references(() => users.id, { onDelete: "cascade" }), title: varchar("title", { length: 180 }).notNull(), type: mysqlEnum("type", ["job", "internship", "volunteering", "scholarship", "training", "call_for_projects", "funding", "mission", "expertise", "other"]).default("other").notNull(), organization: varchar("organization", { length: 180 }), location: varchar("location", { length: 120 }), description: text("description").notNull(), applyUrl: varchar("applyUrl", { length: 500 }), contactEmail: varchar("contactEmail", { length: 320 }), status: mysqlEnum("status", ["pending", "published", "expired", "rejected", "archived"]).default("pending").notNull(), moderationReason: text("moderationReason"), closesAt: timestamp("closesAt"), createdAt: timestamp("createdAt").defaultNow().notNull(), publishedAt: timestamp("publishedAt") }, (table) => [index("opportunities_status_idx").on(table.status, table.createdAt)]);

// --- Événements ---
export const events = mysqlTable("events", { id: int("id").autoincrement().primaryKey(), authorId: int("authorId").notNull().references(() => users.id, { onDelete: "cascade" }), communityId: int("communityId").references(() => communities.id), title: varchar("title", { length: 180 }).notNull(), type: mysqlEnum("type", ["meeting", "camp", "training", "conference", "assembly", "gathering", "webinar", "social", "international_meeting"]).default("meeting").notNull(), description: text("description").notNull(), location: varchar("location", { length: 200 }), isOnline: boolean("isOnline").default(false).notNull(), startsAt: timestamp("startsAt").notNull(), endsAt: timestamp("endsAt"), capacity: int("capacity"), imageStorageKey: varchar("imageStorageKey", { length: 512 }), registrationUrl: varchar("registrationUrl", { length: 500 }), status: mysqlEnum("status", ["pending", "published", "cancelled", "archived"]).default("pending").notNull(), moderationReason: text("moderationReason"), createdAt: timestamp("createdAt").defaultNow().notNull() }, (table) => [index("events_status_idx").on(table.status, table.startsAt), index("events_community_idx").on(table.communityId), index("events_type_idx").on(table.type)]);
export const eventRegistrations = mysqlTable("eventRegistrations", { id: int("id").autoincrement().primaryKey(), eventId: int("eventId").notNull().references(() => events.id, { onDelete: "cascade" }), userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }), status: mysqlEnum("status", ["registered", "cancelled", "waitlisted"]).default("registered").notNull(), registeredAt: timestamp("registeredAt").defaultNow().notNull() }, (table) => [uniqueIndex("event_registration_unique").on(table.eventId, table.userId)]);

// --- Mentorat ---
export const mentorshipRequests = mysqlTable("mentorshipRequests", { id: int("id").autoincrement().primaryKey(), menteeId: int("menteeId").notNull().references(() => users.id, { onDelete: "cascade" }), mentorId: int("mentorId").notNull().references(() => users.id, { onDelete: "cascade" }), topic: varchar("topic", { length: 200 }).notNull(), message: text("message"), status: mysqlEnum("status", ["pending", "accepted", "declined", "completed", "cancelled"]).default("pending").notNull(), scheduledAt: timestamp("scheduledAt"), createdAt: timestamp("createdAt").defaultNow().notNull(), respondedAt: timestamp("respondedAt") }, (table) => [index("mentorship_mentor_idx").on(table.mentorId, table.status), index("mentorship_mentee_idx").on(table.menteeId, table.status)]);

// --- Projets JEC ---
export const projects = mysqlTable("projects", { id: int("id").autoincrement().primaryKey(), ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }), communityId: int("communityId").references(() => communities.id), name: varchar("name", { length: 160 }).notNull(), description: text("description"), domain: varchar("domain", { length: 120 }), location: varchar("location", { length: 160 }), objective: text("objective"), needs: text("needs"), budgetIndicative: varchar("budgetIndicative", { length: 120 }), partners: text("partners"), coverStorageKey: varchar("coverStorageKey", { length: 512 }), coverMimeType: varchar("coverMimeType", { length: 100 }), linkUrl: varchar("linkUrl", { length: 500 }), visibility: mysqlEnum("visibility", ["network", "unit_only", "private"]).default("network").notNull(), status: mysqlEnum("status", ["idea", "in_preparation", "in_progress", "completed", "suspended"]).default("idea").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull() });
export const projectMembers = mysqlTable("projectMembers", { projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }), userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }), role: mysqlEnum("role", ["owner", "member"]).default("member").notNull(), joinedAt: timestamp("joinedAt").defaultNow().notNull() }, (table) => [uniqueIndex("project_member_unique").on(table.projectId, table.userId)]);

// --- Voir - Juger - Agir (cahier §23) ---
export const vjaSheets = mysqlTable("vjaSheets", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  unitId: int("unitId").references(() => organizationalUnits.id),
  seeReality: text("seeReality").notNull(),
  judgeAnalysis: text("judgeAnalysis"),
  judgeReflection: text("judgeReflection"),
  actObjective: text("actObjective"),
  actAction: text("actAction"),
  actResults: text("actResults"),
  actEvaluation: text("actEvaluation"),
  mediaStorageKey: varchar("mediaStorageKey", { length: 512 }),
  mediaMimeType: varchar("mediaMimeType", { length: 100 }),
  linkUrl: varchar("linkUrl", { length: 500 }),
  status: mysqlEnum("status", ["draft", "in_progress", "completed"]).default("draft").notNull(),
  visibility: mysqlEnum("visibility", ["network", "unit_only", "private"]).default("network").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("vja_author_idx").on(table.authorId), index("vja_unit_idx").on(table.unitId)]);

// --- Mémoire JEC (cahier §24) ---
export const memoryEntries = mysqlTable("memoryEntries", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull().references(() => users.id, { onDelete: "cascade" }),
  unitId: int("unitId").references(() => organizationalUnits.id),
  title: varchar("title", { length: 200 }).notNull(),
  periodLabel: varchar("periodLabel", { length: 80 }),
  body: text("body"),
  mediaStorageKey: varchar("mediaStorageKey", { length: 512 }),
  mediaMimeType: varchar("mediaMimeType", { length: 100 }),
  linkUrl: varchar("linkUrl", { length: 500 }),
  status: mysqlEnum("status", ["pending", "published", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("memory_unit_idx").on(table.unitId), index("memory_status_idx").on(table.status)]);

// --- Notifications et communications officielles ---
export const notifications = mysqlTable("notifications", { id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }), type: varchar("type", { length: 60 }).notNull(), title: varchar("title", { length: 200 }).notNull(), body: text("body"), link: varchar("link", { length: 300 }), readAt: timestamp("readAt"), createdAt: timestamp("createdAt").defaultNow().notNull() }, (table) => [index("notifications_user_idx").on(table.userId, table.readAt, table.createdAt)]);
export const campaigns = mysqlTable("campaigns", { id: int("id").autoincrement().primaryKey(), authorId: int("authorId").notNull().references(() => users.id, { onDelete: "cascade" }), title: varchar("title", { length: 200 }).notNull(), body: text("body").notNull(), segment: mysqlEnum("segment", ["all", "verified", "mentors", "unit"]).default("all").notNull(), unitId: int("unitId").references(() => organizationalUnits.id), status: mysqlEnum("status", ["draft", "sent"]).default("draft").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), sentAt: timestamp("sentAt") });

export type User = typeof users.$inferSelect; export type InsertUser = typeof users.$inferInsert;
export type OrganizationalUnit = typeof organizationalUnits.$inferSelect;
export type JecProfile = typeof jecProfiles.$inferSelect;
export type JecExperience = typeof jecExperiences.$inferSelect;
export type Community = typeof communities.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Opportunity = typeof opportunities.$inferSelect;
export type Event = typeof events.$inferSelect;
export type MentorshipRequest = typeof mentorshipRequests.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type VjaSheet = typeof vjaSheets.$inferSelect;
export type MemoryEntry = typeof memoryEntries.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
