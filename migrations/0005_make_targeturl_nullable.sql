-- SQLite does not support dropping NOT NULL constraints directly
-- We need to recreate the table without the NOT NULL constraint
-- This migration makes targetUrl and title nullable

-- Step 1: Create new table with nullable columns
CREATE TABLE `advertisements_new` (
	`adId` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text,
	`title` text,
	`message` text,
	`targetUrl` text,
	`color` text DEFAULT '#3b82f6' NOT NULL,
	`clickCount` integer DEFAULT 0 NOT NULL,
	`viewCount` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);

-- Step 2: Copy data from old table to new table
INSERT INTO `advertisements_new` 
SELECT 
	`adId`,
	`userId`,
	NULL as `name`, -- New column, set to NULL for existing records
	`title`,
	`message`,
	`targetUrl`,
	`color`,
	`clickCount`,
	`viewCount`,
	`createdAt`,
	`updatedAt`
FROM `advertisements`;

-- Step 3: Drop old table
DROP TABLE `advertisements`;

-- Step 4: Rename new table to original name
ALTER TABLE `advertisements_new` RENAME TO `advertisements`;

