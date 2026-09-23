ALTER TABLE `memoryEntries` ADD `linkUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `projects` ADD `coverStorageKey` varchar(512);--> statement-breakpoint
ALTER TABLE `projects` ADD `coverMimeType` varchar(100);--> statement-breakpoint
ALTER TABLE `projects` ADD `linkUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `vjaSheets` ADD `mediaStorageKey` varchar(512);--> statement-breakpoint
ALTER TABLE `vjaSheets` ADD `mediaMimeType` varchar(100);--> statement-breakpoint
ALTER TABLE `vjaSheets` ADD `linkUrl` varchar(500);