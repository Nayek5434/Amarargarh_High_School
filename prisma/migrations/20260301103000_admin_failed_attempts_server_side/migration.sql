-- AlterTable
ALTER TABLE "AdminCredential" ADD COLUMN "failedAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AdminCredential" ADD COLUMN "recoveryUnlocked" BOOLEAN NOT NULL DEFAULT false;
