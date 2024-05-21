/*
  Warnings:

  - You are about to drop the column `userId` on the `Payout` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Payout" DROP CONSTRAINT "Payout_userId_fkey";

-- AlterTable
ALTER TABLE "Payout" DROP COLUMN "userId";
