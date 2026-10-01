// Imports the newsletter articles copied from the old PHP website
// (prisma/data/old-site-newsletters.json) as News items. New items are
// unpublished drafts, or published straight away with --publish. Safe to
// re-run: items whose slug already exists are skipped (pass --update to
// refresh their content instead; the published flag of existing items is
// never changed).
//
//   node scripts/import-old-newsletters.js [--publish] [--update]
const path = require("node:path");
const fs = require("node:fs");
const prisma = require("../src/lib/prisma");
const { normalizeContent, validateContent } = require("../src/lib/contentItems");

const DATA = path.join(__dirname, "../prisma/data/old-site-newsletters.json");

function toRecord(item) {
	return normalizeContent("news", {
		title: item.title,
		slug: item.slug,
		summary: item.summary,
		body: item.body,
		coverImage: item.coverImage,
		publishedAt: item.publishedAt ? `${item.publishedAt}T00:00:00.000Z` : undefined,
	});
}

async function importOldNewsletters({ update = false, publish = false, file = DATA } = {}) {
	const items = JSON.parse(fs.readFileSync(file, "utf8"));
	const result = { created: 0, updated: 0, skipped: 0 };
	for (const item of items) {
		const record = toRecord(item);
		const problem = validateContent("news", { ...record, publishedAt: record.publishedAt.toISOString() });
		if (problem) throw new Error(`Newsletter ${item.oldId} (${item.slug}): ${problem}`);
		const where = { kind_slug: { kind: "news", slug: record.slug } };
		const existing = await prisma.contentItem.findUnique({ where });
		if (!existing) {
			await prisma.contentItem.create({ data: { ...record, published: publish } });
			result.created++;
		} else if (update) {
			const { published, ...fields } = record;
			await prisma.contentItem.update({ where, data: fields });
			result.updated++;
		} else {
			result.skipped++;
		}
	}
	return result;
}

if (require.main === module) {
	const publish = process.argv.includes("--publish");
	importOldNewsletters({ update: process.argv.includes("--update"), publish })
		.then(result => {
			console.log(`Old newsletter import: ${result.created} created (${publish ? "published" : "as drafts"}), ${result.updated} updated, ${result.skipped} skipped.`);
		})
		.catch(error => {
			console.error(error);
			process.exitCode = 1;
		})
		.finally(() => prisma.$disconnect());
}

module.exports = { importOldNewsletters, toRecord };
