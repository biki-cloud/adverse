CREATE TABLE `advertisements` (
	`adId` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`title` text NOT NULL,
	`message` text,
	`imageUrl` text,
	`targetUrl` text NOT NULL,
	`clickCount` integer DEFAULT 0 NOT NULL,
	`viewCount` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clicks` (
	`clickId` text PRIMARY KEY NOT NULL,
	`adId` text NOT NULL,
	`cellId` text NOT NULL,
	`userAgent` text,
	`ipAddress` text,
	`referrer` text,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `grid_cells` (
	`cellId` text PRIMARY KEY NOT NULL,
	`x` integer NOT NULL,
	`y` integer NOT NULL,
	`adId` text,
	`userId` text,
	`isSpecial` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`userId` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text,
	`createdAt` integer NOT NULL
);
