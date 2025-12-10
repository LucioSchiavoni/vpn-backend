/*
  Warnings:

  - A unique constraint covering the columns `[alternativeEmail]` on the table `vpn_users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `vpn_users_alternativeEmail_key` ON `vpn_users`(`alternativeEmail`);
