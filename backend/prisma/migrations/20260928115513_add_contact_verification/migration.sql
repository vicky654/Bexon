-- CreateTable
CREATE TABLE "ContactVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "tracking" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContactSubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "service" TEXT,
    "topic" TEXT,
    "message" TEXT NOT NULL,
    "language" TEXT,
    "utm" TEXT,
    "referrer" TEXT,
    "device" TEXT,
    "ip" TEXT,
    "consentRecorded" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ContactSubmission" ("createdAt", "email", "id", "message", "name", "phone", "service", "status") SELECT "createdAt", "email", "id", "message", "name", "phone", "service", "status" FROM "ContactSubmission";
DROP TABLE "ContactSubmission";
ALTER TABLE "new_ContactSubmission" RENAME TO "ContactSubmission";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
