CREATE TABLE `shark_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`cipher` text NOT NULL,
	`expires` integer NOT NULL,
	`trading` integer NOT NULL
);
