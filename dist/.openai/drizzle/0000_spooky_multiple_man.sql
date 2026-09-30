CREATE TABLE `trade_intents` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`session` text NOT NULL,
	`symbol` text NOT NULL,
	`payload` text NOT NULL,
	`status` text NOT NULL,
	`expires` integer NOT NULL,
	`result` text
);
--> statement-breakpoint
CREATE INDEX `intents_owner_symbol_status` ON `trade_intents` (`owner`,`symbol`,`status`);--> statement-breakpoint
CREATE TABLE `trade_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`cipher` text NOT NULL,
	`expires` integer NOT NULL,
	`trading` integer NOT NULL
);
