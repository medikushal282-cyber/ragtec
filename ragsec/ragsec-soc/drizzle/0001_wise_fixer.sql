CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertKey` varchar(64) NOT NULL,
	`title` text NOT NULL,
	`host` varchar(128) NOT NULL,
	`severity` enum('Critical','High','Medium','Low') NOT NULL,
	`status` enum('New','Investigating','Resolved') NOT NULL DEFAULT 'New',
	`tactic` varchar(128),
	`source` varchar(128),
	`assignedTo` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`),
	CONSTRAINT `alerts_alertKey_unique` UNIQUE(`alertKey`)
);
--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int,
	`action` varchar(128) NOT NULL,
	`target` varchar(255),
	`result` varchar(128),
	`chainHash` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fim_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`host` varchar(128) NOT NULL,
	`filePath` text NOT NULL,
	`changeType` enum('Added','Modified','Deleted') NOT NULL,
	`sha256` varchar(128),
	`riskScore` int NOT NULL DEFAULT 0,
	`judgment` enum('Benign','Suspicious') NOT NULL DEFAULT 'Benign',
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fim_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fleet_hosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hostname` varchar(128) NOT NULL,
	`os` varchar(128),
	`ip` varchar(64),
	`agentStatus` enum('Healthy','At risk','Compromised','Offline') NOT NULL DEFAULT 'Healthy',
	`lastSeenAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fleet_hosts_id` PRIMARY KEY(`id`),
	CONSTRAINT `fleet_hosts_hostname_unique` UNIQUE(`hostname`)
);
--> statement-breakpoint
CREATE TABLE `incident_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentId` int NOT NULL,
	`authorId` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `incident_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentKey` varchar(64) NOT NULL,
	`title` text NOT NULL,
	`severity` enum('Critical','High','Medium','Low') NOT NULL,
	`status` enum('New','Investigating','Resolved') NOT NULL DEFAULT 'Investigating',
	`ownerId` int,
	`escalatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `incidents_id` PRIMARY KEY(`id`),
	CONSTRAINT `incidents_incidentKey_unique` UNIQUE(`incidentKey`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`storageKey` text NOT NULL,
	`ingestionStatus` enum('Queued','Processing','Indexed','Failed') NOT NULL DEFAULT 'Queued',
	`chunkCount` int NOT NULL DEFAULT 0,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledge_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mitigation_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playbookId` int NOT NULL,
	`incidentId` int,
	`requestedBy` int NOT NULL,
	`status` enum('Requested','Approved','Executed','Rejected') NOT NULL DEFAULT 'Requested',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mitigation_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` enum('CriticalAlert','IncidentEscalated') NOT NULL,
	`targetKey` varchar(128) NOT NULL,
	`delivered` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playbooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`description` text,
	`requiresApproval` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `playbooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rag_chunks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int NOT NULL,
	`chunkKey` varchar(128) NOT NULL,
	`content` text NOT NULL,
	`entities` text,
	`relevance` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rag_chunks_id` PRIMARY KEY(`id`),
	CONSTRAINT `rag_chunks_chunkKey_unique` UNIQUE(`chunkKey`)
);
