-- CreateTable
CREATE TABLE "AdminCredential" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "loginId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminCredential_loginId_key" ON "AdminCredential"("loginId");

-- AlterTable
ALTER TABLE "ImportantBox" ADD COLUMN "blockType" TEXT NOT NULL DEFAULT 'TEXT';
ALTER TABLE "ImportantBox" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ImportantBox" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "ImportantBox" ADD COLUMN "lineItems" TEXT;

-- Normalize existing order
UPDATE "ImportantBox"
SET "sortOrder" = "id"
WHERE "sortOrder" = 0;
