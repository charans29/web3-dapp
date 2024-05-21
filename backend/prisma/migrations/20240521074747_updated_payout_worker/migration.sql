/*
  Warnings:

  - The values [failure] on the enum `TxnStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `user_id` on the `Payout` table. All the data in the column will be lost.
  - Added the required column `worker_id` to the `Payout` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TxnStatus_new" AS ENUM ('processing', 'success', 'Failure');
ALTER TABLE "Payout" ALTER COLUMN "status" TYPE "TxnStatus_new" USING ("status"::text::"TxnStatus_new");
ALTER TYPE "TxnStatus" RENAME TO "TxnStatus_old";
ALTER TYPE "TxnStatus_new" RENAME TO "TxnStatus";
DROP TYPE "TxnStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Payout" DROP CONSTRAINT "Payout_user_id_fkey";

-- AlterTable
ALTER TABLE "Payout" DROP COLUMN "user_id",
ADD COLUMN     "userId" INTEGER,
ADD COLUMN     "worker_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
