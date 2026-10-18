CREATE TABLE `learning_chart_reviews` (
	`owner` text NOT NULL,
	`account` text NOT NULL,
	`job_id` text NOT NULL,
	`review_key` text NOT NULL,
	`at` integer NOT NULL,
	`payload` text NOT NULL,
	`updated` integer NOT NULL,
	PRIMARY KEY(`owner`, `account`, `job_id`, `review_key`)
);
--> statement-breakpoint
CREATE INDEX `learning_chart_reviews_range` ON `learning_chart_reviews` (`owner`,`account`,`job_id`,`at`);