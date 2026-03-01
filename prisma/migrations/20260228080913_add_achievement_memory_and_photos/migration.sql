-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN "photoUrl" TEXT;

-- CreateTable
CREATE TABLE "StudentAchievement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentName" TEXT NOT NULL,
    "exam" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "passedOutYear" INTEGER NOT NULL,
    "story" TEXT NOT NULL,
    "photoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
