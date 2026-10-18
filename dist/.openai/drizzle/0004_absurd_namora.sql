CREATE TABLE `trade_monitor_events` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `monitor_events_owner_created` ON `trade_monitor_events` (`owner`,`created_at`);--> statement-breakpoint
CREATE TABLE `trade_monitors` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`payload` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `monitor_owner_updated` ON `trade_monitors` (`owner`,`updated_at`);