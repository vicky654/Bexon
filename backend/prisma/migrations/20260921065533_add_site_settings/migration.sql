-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "primaryColor" TEXT NOT NULL DEFAULT '#02092c',
    "secondaryColor" TEXT NOT NULL DEFAULT '#0c1e21',
    "hoverColor" TEXT NOT NULL DEFAULT '#02092c',
    "textColor" TEXT NOT NULL DEFAULT '#364e52',
    "headingColor" TEXT NOT NULL DEFAULT '#0c1e21',
    "backgroundColor" TEXT NOT NULL DEFAULT '#d8e5e5',
    "updatedAt" DATETIME NOT NULL
);
