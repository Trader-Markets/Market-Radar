CREATE TABLE `whatsapp_events` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `whatsapp_settings` (
	`owner` text PRIMARY KEY NOT NULL,
	`cipher` text NOT NULL,
	`enabled` integer NOT NULL,
	`forming` integer NOT NULL,
	`updates` integer NOT NULL,
	`last_at` integer DEFAULT 0 NOT NULL
);
