CREATE TABLE `professionalExperiences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`kind` enum('work','education','certification') NOT NULL DEFAULT 'work',
	`title` varchar(180) NOT NULL,
	`organization` varchar(180),
	`startDate` date,
	`endDate` date,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `professionalExperiences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `events` ADD `type` enum('meeting','camp','training','conference','assembly','gathering','webinar','social','international_meeting') DEFAULT 'meeting' NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `imageStorageKey` varchar(512);--> statement-breakpoint
ALTER TABLE `events` ADD `registrationUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `jecProfiles` ADD `certifications` json;--> statement-breakpoint
ALTER TABLE `jecProfiles` ADD `interests` json;--> statement-breakpoint
ALTER TABLE `professionalExperiences` ADD CONSTRAINT `professionalExperiences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `professional_experiences_user_idx` ON `professionalExperiences` (`userId`,`startDate`);--> statement-breakpoint
CREATE INDEX `events_type_idx` ON `events` (`type`);