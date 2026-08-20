CREATE TABLE `evidence_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`storageKey` text NOT NULL,
	`sha256` varchar(128),
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidence_attachments_id` PRIMARY KEY(`id`)
);
