CREATE TABLE `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`movie_id` text,
	`name` text NOT NULL,
	`gender` text NOT NULL,
	`lower_age` integer,
	`upper_age` integer,
	`type` text NOT NULL,
	`description` text,
	`exp_screen_time` integer,
	`notes` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `montages` (
	`id` text PRIMARY KEY NOT NULL,
	`scene_id` text,
	`seq_number` integer NOT NULL,
	`ie_flag` text,
	`sl_flag` text,
	`location` text,
	`sub_location` text,
	`weather` text,
	`time` text,
	`description` text,
	`exp_length` integer,
	`num_extras` integer,
	`notes` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`scene_id`) REFERENCES `scenes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `movies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user_id` text,
	`logline` text,
	`description` text,
	`default_flag` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scene_char_map` (
	`id` text PRIMARY KEY NOT NULL,
	`scene_id` text,
	`char_id` text,
	`type` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`scene_id`) REFERENCES `scenes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`char_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scenes` (
	`id` text PRIMARY KEY NOT NULL,
	`movie_id` text,
	`number` integer NOT NULL,
	`act` text,
	`ie_flag` text,
	`sl_flag` text,
	`type` text,
	`location` text,
	`sub_location` text,
	`weather` text,
	`time` text,
	`description` text,
	`exp_length` integer,
	`num_extras` integer,
	`camera_notes` text,
	`lighting_notes` text,
	`sound_notes` text,
	`color_notes` text,
	`prop_notes` text,
	`other_notes` text,
	`relevance_quotient` text,
	`cost_quotient` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);