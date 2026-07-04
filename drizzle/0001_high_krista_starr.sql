CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` varchar(88) NOT NULL,
	`isFavorite` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `delegations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`chainId` int NOT NULL,
	`chainName` varchar(64) NOT NULL,
	`isDelegated` boolean NOT NULL DEFAULT false,
	`delegatedAddress` varchar(42),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `delegations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`senderAddress` varchar(42) NOT NULL,
	`recipientAddress` varchar(88) NOT NULL,
	`token` varchar(64) NOT NULL,
	`amount` decimal(30,8) NOT NULL,
	`sourceChain` varchar(64) NOT NULL,
	`destinationChain` varchar(64) NOT NULL,
	`status` enum('pending','confirmed','failed') NOT NULL DEFAULT 'pending',
	`transactionHash` varchar(256),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `walletAddress` varchar(42);--> statement-breakpoint
ALTER TABLE `users` ADD `evmUniversalAddress` varchar(42);--> statement-breakpoint
ALTER TABLE `users` ADD `solanaUniversalAddress` varchar(88);--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);