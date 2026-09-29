-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContactSubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "type" TEXT NOT NULL DEFAULT 'contact',
    "company" TEXT,
    "partnershipType" TEXT,
    "preferredAt" DATETIME,
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
INSERT INTO "new_ContactSubmission" ("consentRecorded", "createdAt", "device", "email", "id", "ip", "language", "message", "name", "phone", "referrer", "service", "status", "topic", "utm") SELECT "consentRecorded", "createdAt", "device", "email", "id", "ip", "language", "message", "name", "phone", "referrer", "service", "status", "topic", "utm" FROM "ContactSubmission";
DROP TABLE "ContactSubmission";
ALTER TABLE "new_ContactSubmission" RENAME TO "ContactSubmission";
CREATE TABLE "new_ContactVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'contact',
    "company" TEXT,
    "partnershipType" TEXT,
    "preferredAt" DATETIME,
    "topic" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "tracking" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ContactVerification" ("attempts", "createdAt", "email", "expiresAt", "id", "lastSentAt", "message", "name", "otpHash", "phone", "topic", "tracking") SELECT "attempts", "createdAt", "email", "expiresAt", "id", "lastSentAt", "message", "name", "otpHash", "phone", "topic", "tracking" FROM "ContactVerification";
DROP TABLE "ContactVerification";
ALTER TABLE "new_ContactVerification" RENAME TO "ContactVerification";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
