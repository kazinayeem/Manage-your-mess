-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Mess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "coverImage" TEXT,
    "address" TEXT,
    "inviteCode" TEXT NOT NULL,
    "monthlyRules" TEXT,
    "mealRate" REAL NOT NULL DEFAULT 0,
    "totalMeals" INTEGER NOT NULL DEFAULT 0,
    "totalExpenses" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "ownerId" TEXT NOT NULL,
    "managerId" TEXT,
    "currentMonthId" TEXT,
    "subscriptionId" TEXT,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Mess_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mess_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Mess_currentMonthId_fkey" FOREIGN KEY ("currentMonthId") REFERENCES "MessMonth" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Mess_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Mess" ("address", "coverImage", "createdAt", "currentMonthId", "deletedAt", "description", "id", "inviteCode", "logo", "managerId", "mealRate", "monthlyRules", "name", "ownerId", "slug", "subscriptionId", "totalExpenses", "totalMeals", "updatedAt") SELECT "address", "coverImage", "createdAt", "currentMonthId", "deletedAt", "description", "id", "inviteCode", "logo", "managerId", "mealRate", "monthlyRules", "name", "ownerId", "slug", "subscriptionId", "totalExpenses", "totalMeals", "updatedAt" FROM "Mess";
DROP TABLE "Mess";
ALTER TABLE "new_Mess" RENAME TO "Mess";
CREATE UNIQUE INDEX "Mess_slug_key" ON "Mess"("slug");
CREATE UNIQUE INDEX "Mess_inviteCode_key" ON "Mess"("inviteCode");
CREATE UNIQUE INDEX "Mess_currentMonthId_key" ON "Mess"("currentMonthId");
CREATE INDEX "Mess_ownerId_idx" ON "Mess"("ownerId");
CREATE INDEX "Mess_managerId_idx" ON "Mess"("managerId");
CREATE INDEX "Mess_slug_idx" ON "Mess"("slug");
CREATE INDEX "Mess_deletedAt_idx" ON "Mess"("deletedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
