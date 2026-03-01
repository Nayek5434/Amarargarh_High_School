-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AdminCredential" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "loginId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AdminCredential" ("createdAt", "id", "loginId", "passwordHash", "updatedAt") SELECT "createdAt", "id", "loginId", "passwordHash", "updatedAt" FROM "AdminCredential";
DROP TABLE "AdminCredential";
ALTER TABLE "new_AdminCredential" RENAME TO "AdminCredential";
CREATE UNIQUE INDEX "AdminCredential_loginId_key" ON "AdminCredential"("loginId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
