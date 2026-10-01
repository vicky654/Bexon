const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");

const testDbPath = path.join(__dirname, "../../data/test-import-old-newsletters.db");
process.env.DATABASE_URL = `file:${testDbPath}`;

if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
execSync("npx prisma db push --skip-generate --schema=./prisma/schema.prisma", {
	cwd: path.join(__dirname, "../.."),
	stdio: "inherit",
	env: process.env,
});

const test = require("node:test");
const assert = require("node:assert/strict");
const prisma = require("./prisma");
const { importOldNewsletters } = require("../../scripts/import-old-newsletters");

const DATA = path.join(__dirname, "../../prisma/data/old-site-newsletters.json");
const SITE_PUBLIC = path.join(__dirname, "../../../public");
const items = JSON.parse(fs.readFileSync(DATA, "utf8"));

test("old-site newsletter data is complete and points at files the website ships", () => {
	assert.equal(items.length, 50);
	assert.equal(new Set(items.map(i => i.slug)).size, items.length, "slugs must be unique");
	for (const item of items) {
		assert.ok(item.title && item.body && item.summary, `newsletter ${item.oldId}`);
		assert.ok(fs.existsSync(path.join(SITE_PUBLIC, item.coverImage)), `cover for ${item.oldId}`);
		for (const [, src] of item.body.matchAll(/<img[^>]*src="([^"]+)"/g)) {
			assert.ok(src.startsWith("/images/news/") && fs.existsSync(path.join(SITE_PUBLIC, src)), `${item.oldId}: ${src}`);
		}
		assert.ok(!/dpdpconsultants\.com\/[^"]*\.php/.test(item.body), `${item.oldId} still links to an old .php page`);
		assert.ok(!/<script|on\w+=|javascript:/i.test(item.body), `${item.oldId} has unsafe markup`);
	}
});

test("imports every newsletter as a News draft (or published) and is safe to re-run", async t => {
	t.after(async () => {
		await prisma.contentItem.deleteMany();
	});
	assert.deepEqual(await importOldNewsletters({ file: DATA }), { created: 50, updated: 0, skipped: 0 });
	assert.equal(await prisma.contentItem.count({ where: { kind: "news", published: false } }), 50);
	const sample = await prisma.contentItem.findUnique({ where: { kind_slug: { kind: "news", slug: items[0].slug } } });
	assert.equal(sample.title, items[0].title);
	assert.equal(sample.coverImage, items[0].coverImage);
	assert.deepEqual(await importOldNewsletters({ file: DATA }), { created: 0, updated: 0, skipped: 50 });

	await prisma.contentItem.deleteMany();
	assert.equal((await importOldNewsletters({ file: DATA, publish: true })).created, 50);
	assert.equal(await prisma.contentItem.count({ where: { kind: "news", published: true } }), 50);
});
