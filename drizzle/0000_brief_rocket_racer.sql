CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int,
	`actorRole` varchar(32),
	`action` varchar(120) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` varchar(80) NOT NULL,
	`reason` text,
	`before` json,
	`after` json,
	`requestId` varchar(80),
	`ipHash` varchar(128),
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`body` text NOT NULL,
	`segment` enum('all','verified','mentors','unit') NOT NULL DEFAULT 'all',
	`unitId` int,
	`status` enum('draft','sent') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`sentAt` timestamp,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`imageStorageKey` varchar(512),
	`scope` enum('international','regional','national','professional','thematic') NOT NULL DEFAULT 'thematic',
	`unitId` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communityMembers` (
	`communityId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('admin','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_member_unique` UNIQUE(`communityId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userAId` int NOT NULL,
	`userBId` int NOT NULL,
	`initiatedById` int NOT NULL,
	`status` enum('pending','accepted','declined','blocked') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	CONSTRAINT `connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `connection_pair_unique` UNIQUE(`userAId`,`userBId`)
);
--> statement-breakpoint
CREATE TABLE `conversationMembers` (
	`conversationId` int NOT NULL,
	`userId` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`leftAt` timestamp,
	`lastReadMessageId` int,
	`mutedAt` timestamp,
	CONSTRAINT `conversation_member_unique` UNIQUE(`conversationId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` enum('direct','group') NOT NULL DEFAULT 'direct',
	`directPairKey` varchar(40),
	`unitId` int,
	`title` varchar(160),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastMessageAt` timestamp,
	`archivedAt` timestamp,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversations_directPairKey_unique` UNIQUE(`directPairKey`),
	CONSTRAINT `conversation_unit_unique` UNIQUE(`unitId`)
);
--> statement-breakpoint
CREATE TABLE `eventRegistrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('registered','cancelled','waitlisted') NOT NULL DEFAULT 'registered',
	`registeredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `eventRegistrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `event_registration_unique` UNIQUE(`eventId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`location` varchar(200),
	`isOnline` boolean NOT NULL DEFAULT false,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp,
	`capacity` int,
	`status` enum('pending','published','cancelled','archived') NOT NULL DEFAULT 'pending',
	`moderationReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jecExperiences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`unitId` int,
	`movementLabel` varchar(160),
	`functionTitle` varchar(160) NOT NULL,
	`startDate` date,
	`endDate` date,
	`description` text,
	`responsibilities` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jecExperiences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jecProfiles` (
	`userId` int NOT NULL,
	`unitId` int,
	`firstName` varchar(100),
	`lastName` varchar(100),
	`headline` varchar(180),
	`jecStatus` enum('active_jeciste','alumni_jeciste','former_leader','current_leader','chaplain','facilitator','volunteer','supporter') NOT NULL DEFAULT 'alumni_jeciste',
	`organization` varchar(180),
	`jobTitle` varchar(180),
	`sector` varchar(120),
	`bio` text,
	`country` varchar(100),
	`city` varchar(120),
	`languages` json,
	`skills` json,
	`website` varchar(300),
	`socialLinks` json,
	`avatarStorageKey` varchar(512),
	`coverStorageKey` varchar(512),
	`directoryVisibility` enum('network','unit_only','private') NOT NULL DEFAULT 'network',
	`mentorAvailable` boolean NOT NULL DEFAULT false,
	`mentorTopics` json,
	`availableForCollaboration` boolean NOT NULL DEFAULT false,
	`availableAsExpert` boolean NOT NULL DEFAULT false,
	`availableForProjects` boolean NOT NULL DEFAULT false,
	`privacyEmail` enum('public','members','connections','private') NOT NULL DEFAULT 'connections',
	`privacyPhone` enum('public','members','connections','private') NOT NULL DEFAULT 'private',
	`privacyCity` enum('public','members','connections','private') NOT NULL DEFAULT 'members',
	`privacyJecPath` enum('public','members','connections','private') NOT NULL DEFAULT 'public',
	`privacyProfessionalPath` enum('public','members','connections','private') NOT NULL DEFAULT 'public',
	`phone` varchar(40),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jecProfiles_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `memoryEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`unitId` int,
	`title` varchar(200) NOT NULL,
	`periodLabel` varchar(80),
	`body` text,
	`mediaStorageKey` varchar(512),
	`mediaMimeType` varchar(100),
	`status` enum('pending','published','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memoryEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mentorshipRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menteeId` int NOT NULL,
	`mentorId` int NOT NULL,
	`topic` varchar(200) NOT NULL,
	`message` text,
	`status` enum('pending','accepted','declined','completed','cancelled') NOT NULL DEFAULT 'pending',
	`scheduledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	CONSTRAINT `mentorshipRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messageAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`sizeBytes` int NOT NULL,
	`durationMs` int,
	`thumbnailKey` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messageAttachments_id` PRIMARY KEY(`id`),
	CONSTRAINT `storage_key_unique` UNIQUE(`storageKey`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`senderId` int NOT NULL,
	`body` text,
	`kind` enum('text','attachment','voice','system') NOT NULL DEFAULT 'text',
	`replyToId` int,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`editedAt` timestamp,
	`deletedAt` timestamp,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(60) NOT NULL,
	`title` varchar(200) NOT NULL,
	`body` text,
	`link` varchar(300),
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`type` enum('job','internship','volunteering','scholarship','training','call_for_projects','funding','mission','expertise','other') NOT NULL DEFAULT 'other',
	`organization` varchar(180),
	`location` varchar(120),
	`description` text NOT NULL,
	`applyUrl` varchar(500),
	`contactEmail` varchar(320),
	`status` enum('pending','published','expired','rejected','archived') NOT NULL DEFAULT 'pending',
	`moderationReason` text,
	`closesAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`publishedAt` timestamp,
	CONSTRAINT `opportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizationalUnits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentId` int,
	`level` enum('international','regional','national','local','group') NOT NULL,
	`name` varchar(160) NOT NULL,
	`localTypeLabel` varchar(80),
	`description` text,
	`countryCode` varchar(2),
	`logoStorageKey` varchar(512),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizationalUnits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `postComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`authorId` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`hiddenAt` timestamp,
	`deletedAt` timestamp,
	CONSTRAINT `postComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `postReactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int NOT NULL,
	`kind` enum('like','celebrate','support','insightful') NOT NULL DEFAULT 'like',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `postReactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `reaction_unique` UNIQUE(`postId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`body` text NOT NULL,
	`category` enum('news','testimony','reflection','project','opportunity','event','training','call_for_contribution','skills_request','volunteer_request') NOT NULL DEFAULT 'news',
	`visibility` enum('network','unit_only','public') NOT NULL DEFAULT 'network',
	`attachmentStorageKey` varchar(512),
	`attachmentMimeType` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`editedAt` timestamp,
	`hiddenAt` timestamp,
	`hiddenReason` varchar(500),
	`deletedAt` timestamp,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectMembers` (
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_member_unique` UNIQUE(`projectId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`domain` varchar(120),
	`location` varchar(160),
	`objective` text,
	`needs` text,
	`budgetIndicative` varchar(120),
	`partners` text,
	`visibility` enum('network','unit_only','private') NOT NULL DEFAULT 'network',
	`status` enum('idea','in_preparation','in_progress','completed','suspended') NOT NULL DEFAULT 'idea',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`targetType` enum('post','comment','message','profile','opportunity','event','project') NOT NULL,
	`targetId` int NOT NULL,
	`reason` varchar(120) NOT NULL,
	`details` text,
	`status` enum('open','under_review','escalated','resolved','dismissed') NOT NULL DEFAULT 'open',
	`decision` varchar(60),
	`decisionReason` text,
	`handledBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` enum('member','mentor','moderator','verification_officer','community_admin','local_admin','national_admin','regional_admin','international_admin','super_admin') NOT NULL,
	`label` varchar(80) NOT NULL,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `savedItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemType` enum('post','opportunity','event','project') NOT NULL,
	`itemId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `saved_item_unique` UNIQUE(`userId`,`itemType`,`itemId`)
);
--> statement-breakpoint
CREATE TABLE `userRoles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`roleId` int NOT NULL,
	`scopeType` enum('global','unit','community') NOT NULL DEFAULT 'global',
	`scopeId` int,
	`assignedBy` int,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	`reason` varchar(500),
	CONSTRAINT `userRoles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_role_scope_unique` UNIQUE(`userId`,`roleId`,`scopeType`,`scopeId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`passwordHash` varchar(255),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`accountStatus` enum('pending_verification','verified','rejected','suspended','deactivated') NOT NULL DEFAULT 'pending_verification',
	`emailVerifiedAt` timestamp,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verificationDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`verificationRequestId` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verificationDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verificationRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('submitted','needs_information','approved','rejected') NOT NULL DEFAULT 'submitted',
	`decisionReason` text,
	`reviewedBy` int,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verificationRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vjaSheets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`unitId` int,
	`seeReality` text NOT NULL,
	`judgeAnalysis` text,
	`judgeReflection` text,
	`actObjective` text,
	`actAction` text,
	`actResults` text,
	`actEvaluation` text,
	`status` enum('draft','in_progress','completed') NOT NULL DEFAULT 'draft',
	`visibility` enum('network','unit_only','private') NOT NULL DEFAULT 'network',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vjaSheets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_actorId_users_id_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_unitId_organizationalUnits_id_fk` FOREIGN KEY (`unitId`) REFERENCES `organizationalUnits`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communities` ADD CONSTRAINT `communities_unitId_organizationalUnits_id_fk` FOREIGN KEY (`unitId`) REFERENCES `organizationalUnits`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communities` ADD CONSTRAINT `communities_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communityMembers` ADD CONSTRAINT `communityMembers_communityId_communities_id_fk` FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communityMembers` ADD CONSTRAINT `communityMembers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `connections` ADD CONSTRAINT `connections_userAId_users_id_fk` FOREIGN KEY (`userAId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `connections` ADD CONSTRAINT `connections_userBId_users_id_fk` FOREIGN KEY (`userBId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `connections` ADD CONSTRAINT `connections_initiatedById_users_id_fk` FOREIGN KEY (`initiatedById`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversationMembers` ADD CONSTRAINT `conversationMembers_conversationId_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversationMembers` ADD CONSTRAINT `conversationMembers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_unitId_organizationalUnits_id_fk` FOREIGN KEY (`unitId`) REFERENCES `organizationalUnits`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `eventRegistrations` ADD CONSTRAINT `eventRegistrations_eventId_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `eventRegistrations` ADD CONSTRAINT `eventRegistrations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jecExperiences` ADD CONSTRAINT `jecExperiences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jecExperiences` ADD CONSTRAINT `jecExperiences_unitId_organizationalUnits_id_fk` FOREIGN KEY (`unitId`) REFERENCES `organizationalUnits`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jecProfiles` ADD CONSTRAINT `jecProfiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jecProfiles` ADD CONSTRAINT `jecProfiles_unitId_organizationalUnits_id_fk` FOREIGN KEY (`unitId`) REFERENCES `organizationalUnits`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memoryEntries` ADD CONSTRAINT `memoryEntries_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memoryEntries` ADD CONSTRAINT `memoryEntries_unitId_organizationalUnits_id_fk` FOREIGN KEY (`unitId`) REFERENCES `organizationalUnits`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mentorshipRequests` ADD CONSTRAINT `mentorshipRequests_menteeId_users_id_fk` FOREIGN KEY (`menteeId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mentorshipRequests` ADD CONSTRAINT `mentorshipRequests_mentorId_users_id_fk` FOREIGN KEY (`mentorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messageAttachments` ADD CONSTRAINT `messageAttachments_messageId_messages_id_fk` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversationId_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opportunities` ADD CONSTRAINT `opportunities_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `postComments` ADD CONSTRAINT `postComments_postId_posts_id_fk` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `postComments` ADD CONSTRAINT `postComments_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `postReactions` ADD CONSTRAINT `postReactions_postId_posts_id_fk` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `postReactions` ADD CONSTRAINT `postReactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projectMembers` ADD CONSTRAINT `projectMembers_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projectMembers` ADD CONSTRAINT `projectMembers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_reporterId_users_id_fk` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_handledBy_users_id_fk` FOREIGN KEY (`handledBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedItems` ADD CONSTRAINT `savedItems_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userRoles` ADD CONSTRAINT `userRoles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userRoles` ADD CONSTRAINT `userRoles_roleId_roles_id_fk` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userRoles` ADD CONSTRAINT `userRoles_assignedBy_users_id_fk` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verificationDocuments` ADD CONSTRAINT `verificationDocuments_verificationRequestId_verificationRequests_id_fk` FOREIGN KEY (`verificationRequestId`) REFERENCES `verificationRequests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verificationRequests` ADD CONSTRAINT `verificationRequests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verificationRequests` ADD CONSTRAINT `verificationRequests_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vjaSheets` ADD CONSTRAINT `vjaSheets_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vjaSheets` ADD CONSTRAINT `vjaSheets_unitId_organizationalUnits_id_fk` FOREIGN KEY (`unitId`) REFERENCES `organizationalUnits`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `auditLogs` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `audit_actor_idx` ON `auditLogs` (`actorId`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `communities_scope_idx` ON `communities` (`scope`);--> statement-breakpoint
CREATE INDEX `communities_unit_idx` ON `communities` (`unitId`);--> statement-breakpoint
CREATE INDEX `community_members_user_idx` ON `communityMembers` (`userId`);--> statement-breakpoint
CREATE INDEX `connection_recipient_idx` ON `connections` (`userBId`,`status`);--> statement-breakpoint
CREATE INDEX `conversation_member_user_idx` ON `conversationMembers` (`userId`);--> statement-breakpoint
CREATE INDEX `conversation_recent_idx` ON `conversations` (`lastMessageAt`);--> statement-breakpoint
CREATE INDEX `events_status_idx` ON `events` (`status`,`startsAt`);--> statement-breakpoint
CREATE INDEX `jec_experiences_user_idx` ON `jecExperiences` (`userId`,`startDate`);--> statement-breakpoint
CREATE INDEX `jec_experiences_unit_idx` ON `jecExperiences` (`unitId`);--> statement-breakpoint
CREATE INDEX `jec_profiles_unit_idx` ON `jecProfiles` (`unitId`);--> statement-breakpoint
CREATE INDEX `jec_profiles_mentor_idx` ON `jecProfiles` (`mentorAvailable`);--> statement-breakpoint
CREATE INDEX `jec_profiles_status_idx` ON `jecProfiles` (`jecStatus`);--> statement-breakpoint
CREATE INDEX `memory_unit_idx` ON `memoryEntries` (`unitId`);--> statement-breakpoint
CREATE INDEX `memory_status_idx` ON `memoryEntries` (`status`);--> statement-breakpoint
CREATE INDEX `mentorship_mentor_idx` ON `mentorshipRequests` (`mentorId`,`status`);--> statement-breakpoint
CREATE INDEX `mentorship_mentee_idx` ON `mentorshipRequests` (`menteeId`,`status`);--> statement-breakpoint
CREATE INDEX `message_attachment_idx` ON `messageAttachments` (`messageId`);--> statement-breakpoint
CREATE INDEX `messages_thread_idx` ON `messages` (`conversationId`,`sentAt`);--> statement-breakpoint
CREATE INDEX `messages_sender_idx` ON `messages` (`senderId`,`sentAt`);--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`userId`,`readAt`,`createdAt`);--> statement-breakpoint
CREATE INDEX `opportunities_status_idx` ON `opportunities` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `org_units_parent_idx` ON `organizationalUnits` (`parentId`);--> statement-breakpoint
CREATE INDEX `org_units_level_idx` ON `organizationalUnits` (`level`);--> statement-breakpoint
CREATE INDEX `org_units_country_idx` ON `organizationalUnits` (`countryCode`);--> statement-breakpoint
CREATE INDEX `comments_post_idx` ON `postComments` (`postId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `posts_feed_idx` ON `posts` (`createdAt`);--> statement-breakpoint
CREATE INDEX `posts_author_idx` ON `posts` (`authorId`);--> statement-breakpoint
CREATE INDEX `reports_status_idx` ON `reports` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `reports_target_idx` ON `reports` (`targetType`,`targetId`);--> statement-breakpoint
CREATE INDEX `user_roles_user_idx` ON `userRoles` (`userId`);--> statement-breakpoint
CREATE INDEX `users_status_idx` ON `users` (`accountStatus`);--> statement-breakpoint
CREATE INDEX `verification_queue_idx` ON `verificationRequests` (`status`,`submittedAt`);--> statement-breakpoint
CREATE INDEX `verification_user_idx` ON `verificationRequests` (`userId`);--> statement-breakpoint
CREATE INDEX `vja_author_idx` ON `vjaSheets` (`authorId`);--> statement-breakpoint
CREATE INDEX `vja_unit_idx` ON `vjaSheets` (`unitId`);