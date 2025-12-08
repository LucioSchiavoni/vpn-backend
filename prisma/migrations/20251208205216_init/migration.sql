-- CreateTable
CREATE TABLE `system_users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'USER', 'READONLY') NOT NULL DEFAULT 'USER',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastLogin` DATETIME(3) NULL,

    UNIQUE INDEX `system_users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vpn_users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `alternativeEmail` VARCHAR(191) NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NULL,
    `position` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_APPROVAL') NOT NULL DEFAULT 'ACTIVE',
    `fortiGateUserId` VARCHAR(191) NULL,
    `lastConnection` DATETIME(3) NULL,
    `lastConnectionIp` VARCHAR(191) NULL,
    `lastConnectionCountry` VARCHAR(191) NULL,
    `lastConnectionCity` VARCHAR(191) NULL,
    `createdInFortiGate` BOOLEAN NOT NULL DEFAULT false,
    `syncedWithFortiGate` BOOLEAN NOT NULL DEFAULT false,
    `lastSyncAt` DATETIME(3) NULL,
    `trackingStartDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `historicalDataAvailable` BOOLEAN NOT NULL DEFAULT false,
    `policyAcceptedAt` DATETIME(3) NULL,
    `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    `twoFactorNotifiedAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vpn_users_username_key`(`username`),
    UNIQUE INDEX `vpn_users_fortiGateUserId_key`(`fortiGateUserId`),
    INDEX `vpn_users_username_idx`(`username`),
    INDEX `vpn_users_status_idx`(`status`),
    INDEX `vpn_users_lastConnection_idx`(`lastConnection`),
    INDEX `vpn_users_syncedWithFortiGate_idx`(`syncedWithFortiGate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `connection_logs` (
    `id` VARCHAR(191) NOT NULL,
    `vpnUserId` VARCHAR(191) NOT NULL,
    `connectionStatus` ENUM('CONNECTED', 'DISCONNECTED') NOT NULL,
    `ipAddress` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NULL,
    `countryCode` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `connectedAt` DATETIME(3) NOT NULL,
    `disconnectedAt` DATETIME(3) NULL,
    `durationSeconds` INTEGER NULL,
    `bytesReceived` INTEGER NULL,
    `bytesSent` INTEGER NULL,
    `deviceInfo` VARCHAR(191) NULL,
    `isAnomaly` BOOLEAN NOT NULL DEFAULT false,
    `anomalyReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `connection_logs_vpnUserId_idx`(`vpnUserId`),
    INDEX `connection_logs_connectedAt_idx`(`connectedAt`),
    INDEX `connection_logs_country_idx`(`country`),
    INDEX `connection_logs_isAnomaly_idx`(`isAnomaly`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alerts` (
    `id` VARCHAR(191) NOT NULL,
    `vpnUserId` VARCHAR(191) NOT NULL,
    `type` ENUM('GEOGRAPHIC_ANOMALY', 'FIRST_CONNECTION_NEW_COUNTRY', 'MULTIPLE_FAILED_ATTEMPTS', 'SUSPICIOUS_PATTERN', 'INACTIVE_USER_RECONNECTED', 'HIGH_RISK_COUNTRY') NOT NULL,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    `status` ENUM('PENDING', 'ACKNOWLEDGED', 'RESOLVED', 'IGNORED') NOT NULL DEFAULT 'PENDING',
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `metadata` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `previousCountry` VARCHAR(191) NULL,
    `detectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` VARCHAR(191) NULL,
    `acknowledgedById` VARCHAR(191) NULL,
    `acknowledgedAt` DATETIME(3) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `resolution` TEXT NULL,
    `notificationSent` BOOLEAN NOT NULL DEFAULT false,
    `notificationSentAt` DATETIME(3) NULL,

    INDEX `alerts_vpnUserId_idx`(`vpnUserId`),
    INDEX `alerts_status_idx`(`status`),
    INDEX `alerts_severity_idx`(`severity`),
    INDEX `alerts_detectedAt_idx`(`detectedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `travel_registrations` (
    `id` VARCHAR(191) NOT NULL,
    `vpnUserId` VARCHAR(191) NOT NULL,
    `countries` JSON NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `purpose` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `travel_registrations_vpnUserId_idx`(`vpnUserId`),
    INDEX `travel_registrations_startDate_endDate_idx`(`startDate`, `endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `changes` JSON NULL,
    `previousValues` JSON NULL,
    `newValues` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `performedById` VARCHAR(191) NOT NULL,
    `vpnUserId` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `audit_logs_performedById_idx`(`performedById`),
    INDEX `audit_logs_timestamp_idx`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_logs` (
    `id` VARCHAR(191) NOT NULL,
    `vpnUserId` VARCHAR(191) NULL,
    `recipientEmail` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `templateName` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `errorMessage` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notification_logs_vpnUserId_idx`(`vpnUserId`),
    INDEX `notification_logs_sentAt_idx`(`sentAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_configurations` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_configurations_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fortigate_sync_logs` (
    `id` VARCHAR(191) NOT NULL,
    `syncType` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `usersProcessed` INTEGER NOT NULL DEFAULT 0,
    `usersCreated` INTEGER NOT NULL DEFAULT 0,
    `usersUpdated` INTEGER NOT NULL DEFAULT 0,
    `usersFailed` INTEGER NOT NULL DEFAULT 0,
    `errorDetails` JSON NULL,
    `metadata` JSON NULL,
    `startedAt` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,
    `durationMs` INTEGER NULL,

    INDEX `fortigate_sync_logs_startedAt_idx`(`startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vpn_users` ADD CONSTRAINT `vpn_users_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `system_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vpn_users` ADD CONSTRAINT `vpn_users_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `system_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `connection_logs` ADD CONSTRAINT `connection_logs_vpnUserId_fkey` FOREIGN KEY (`vpnUserId`) REFERENCES `vpn_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_vpnUserId_fkey` FOREIGN KEY (`vpnUserId`) REFERENCES `vpn_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `system_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_acknowledgedById_fkey` FOREIGN KEY (`acknowledgedById`) REFERENCES `system_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `travel_registrations` ADD CONSTRAINT `travel_registrations_vpnUserId_fkey` FOREIGN KEY (`vpnUserId`) REFERENCES `vpn_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_performedById_fkey` FOREIGN KEY (`performedById`) REFERENCES `system_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_vpnUserId_fkey` FOREIGN KEY (`vpnUserId`) REFERENCES `vpn_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_logs` ADD CONSTRAINT `notification_logs_vpnUserId_fkey` FOREIGN KEY (`vpnUserId`) REFERENCES `vpn_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
