/*
  Warnings:

  - You are about to drop the column `refreshToken` on the `system_users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `system_users` DROP COLUMN `refreshToken`,
    ADD COLUMN `failedLoginAttempts` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `isLocked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastFailedAttempt` DATETIME(3) NULL,
    ADD COLUMN `lockedUntil` DATETIME(3) NULL;
