-- AlterTable: optional SEO title and cover image alt text for blog posts.
ALTER TABLE "Blog" ADD COLUMN "metaTitle" TEXT;
ALTER TABLE "Blog" ADD COLUMN "imgAlt" TEXT;
