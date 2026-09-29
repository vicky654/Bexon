-- AlterTable
ALTER TABLE "ContactSubmission" ADD COLUMN "contentId" INTEGER;
ALTER TABLE "ContactSubmission" ADD COLUMN "contentTitle" TEXT;

-- AlterTable
ALTER TABLE "ContactVerification" ADD COLUMN "contentId" INTEGER;
ALTER TABLE "ContactVerification" ADD COLUMN "contentTitle" TEXT;

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "coverImage" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceUrl" TEXT,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "format" TEXT,
    "venue" TEXT,
    "recordingUrl" TEXT,
    "resourceType" TEXT,
    "fileKey" TEXT,
    "gated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ContentItem_kind_published_idx" ON "ContentItem"("kind", "published");

-- CreateIndex
CREATE UNIQUE INDEX "ContentItem_kind_slug_key" ON "ContentItem"("kind", "slug");
