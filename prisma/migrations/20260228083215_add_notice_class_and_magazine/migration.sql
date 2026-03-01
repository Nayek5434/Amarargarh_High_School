-- CreateTable
CREATE TABLE "MagazinePost" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Notice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "targetClass" TEXT NOT NULL DEFAULT 'ALL',
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Notice" ("content", "id", "publishedAt", "title") SELECT "content", "id", "publishedAt", "title" FROM "Notice";
DROP TABLE "Notice";
ALTER TABLE "new_Notice" RENAME TO "Notice";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
