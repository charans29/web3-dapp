-- AlterTable
ALTER TABLE "Worker" ALTER COLUMN "log" DROP NOT NULL,
ALTER COLUMN "log" SET DEFAULT '_';
