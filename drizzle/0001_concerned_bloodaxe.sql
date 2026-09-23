CREATE TABLE `communityDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`communityId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`mimeType` varchar(100),
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communityDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `communityMembers` ADD `status` enum('pending','approved','rejected') DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `communityMembers` ADD `respondedBy` int;--> statement-breakpoint
ALTER TABLE `communityMembers` ADD `respondedAt` timestamp;--> statement-breakpoint
ALTER TABLE `conversations` ADD `communityId` int;--> statement-breakpoint
ALTER TABLE `events` ADD `communityId` int;--> statement-breakpoint
ALTER TABLE `posts` ADD `communityId` int;--> statement-breakpoint
ALTER TABLE `projects` ADD `communityId` int;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversation_community_unique` UNIQUE(`communityId`);--> statement-breakpoint
ALTER TABLE `communityDocuments` ADD CONSTRAINT `communityDocuments_communityId_communities_id_fk` FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communityDocuments` ADD CONSTRAINT `communityDocuments_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `community_documents_community_idx` ON `communityDocuments` (`communityId`);--> statement-breakpoint
ALTER TABLE `communityMembers` ADD CONSTRAINT `communityMembers_respondedBy_users_id_fk` FOREIGN KEY (`respondedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_communityId_communities_id_fk` FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_communityId_communities_id_fk` FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_communityId_communities_id_fk` FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_communityId_communities_id_fk` FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `community_members_status_idx` ON `communityMembers` (`communityId`,`status`);--> statement-breakpoint
CREATE INDEX `events_community_idx` ON `events` (`communityId`);--> statement-breakpoint
CREATE INDEX `posts_community_idx` ON `posts` (`communityId`);