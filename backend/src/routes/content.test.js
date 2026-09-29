const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { execSync } = require("node:child_process");

const testDbPath = path.join(__dirname, "../../data/test-content.db");
process.env.DATABASE_URL = `file:${testDbPath}`;

const resourceFilesDir = fs.mkdtempSync(path.join(os.tmpdir(), "dpdp-res-"));
process.env.RESOURCE_FILES_DIR = resourceFilesDir;
process.env.JWT_SECRET = "test-secret";
delete process.env.DOWNLOAD_TOKEN_SECRET;

if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
execSync("npx prisma db push --skip-generate --schema=./prisma/schema.prisma", {
	cwd: path.join(__dirname, "../.."),
	stdio: "inherit",
	env: process.env,
});

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const prisma = require("../lib/prisma");

// Requiring the Prisma client can itself load backend/.env (dotenv doesn't
// overwrite vars that are already set, but ours were just deleted/set above),
// so clear/re-set them again here in case that happened.
delete process.env.DOWNLOAD_TOKEN_SECRET;
process.env.RESOURCE_FILES_DIR = resourceFilesDir;
process.env.JWT_SECRET = "test-secret";

const { signDownloadToken } = require("../lib/downloadTokens");

function buildApp() {
	return require("../app")();
}

const DAY = 24 * 60 * 60 * 1000;
const days = n => new Date(Date.now() + n * DAY);

async function make(data) {
	return prisma.contentItem.create({
		data: { title: "T", summary: "S", published: true, ...data },
	});
}

test.beforeEach(async () => {
	await prisma.contentItem.deleteMany();
});

test("unknown kind is rejected", async () => {
	const res = await request(buildApp()).get("/api/content?kind=blog");
	assert.equal(res.status, 400);
	assert.equal(res.body.message, "Unknown content type.");
});

test("lists only published items of the kind, newest first, paginated by 9", async () => {
	for (let i = 0; i < 11; i += 1) await make({ kind: "news", slug: `n-${i}`, publishedAt: days(-i) });
	await make({ kind: "news", slug: "draft", published: false });
	await make({ kind: "resource", slug: "r-1", resourceType: "guide" });

	const first = await request(buildApp()).get("/api/content?kind=news");
	assert.equal(first.body.total, 11);
	assert.equal(first.body.pageSize, 9);
	assert.equal(first.body.items.length, 9);
	assert.equal(first.body.items[0].slug, "n-0");

	const second = await request(buildApp()).get("/api/content?kind=news&page=2");
	assert.equal(second.body.items.length, 2);
	assert.equal(second.body.page, 2);

	const garbage = await request(buildApp()).get("/api/content?kind=news&page=-4");
	assert.equal(garbage.body.page, 1);
});

test("pagination is stable when publishedAt ties: pages 1 and 2 together cover all items", async () => {
	const samePublishedAt = days(-1);
	for (let i = 0; i < 10; i += 1) {
		await make({ kind: "news", slug: `tie-${i}`, publishedAt: samePublishedAt });
	}

	const first = await request(buildApp()).get("/api/content?kind=news");
	const second = await request(buildApp()).get("/api/content?kind=news&page=2");
	const slugs = [...first.body.items, ...second.body.items].map(i => i.slug);

	assert.equal(slugs.length, 10);
	assert.equal(new Set(slugs).size, 10);
});

test("resources filter by type and never expose the file name", async () => {
	await make({ kind: "resource", slug: "g", resourceType: "guide", fileKey: "1-1.pdf" });
	await make({ kind: "resource", slug: "w", resourceType: "whitepaper" });
	const res = await request(buildApp()).get("/api/content?kind=resource&resourceType=guide");
	assert.equal(res.body.items.length, 1);
	assert.equal(res.body.items[0].fileKey, undefined);
	assert.equal(res.body.items[0].hasFile, true);
	assert.equal(JSON.stringify(res.body).includes("1-1.pdf"), false);
});

test("events split into upcoming (soonest first) and past (latest first)", async () => {
	await make({ kind: "event", slug: "next-week", startsAt: days(7), format: "online" });
	await make({ kind: "event", slug: "tomorrow", startsAt: days(1), format: "online" });
	await make({ kind: "event", slug: "running", startsAt: days(-1), endsAt: days(1), format: "online" });
	await make({ kind: "event", slug: "last-month", startsAt: days(-30), format: "online" });
	await make({ kind: "event", slug: "yesterday-no-end", startsAt: days(-1), format: "online" });

	const upcoming = await request(buildApp()).get("/api/content?kind=event");
	assert.deepEqual(upcoming.body.items.map(i => i.slug), ["running", "tomorrow", "next-week"]);

	const past = await request(buildApp()).get("/api/content?kind=event&when=past");
	assert.deepEqual(past.body.items.map(i => i.slug), ["yesterday-no-end", "last-month"]);
});

test("detail returns published items and 404s drafts and unknown slugs", async () => {
	await make({ kind: "news", slug: "live" });
	await make({ kind: "news", slug: "hidden", published: false });
	assert.equal((await request(buildApp()).get("/api/content/news/live")).status, 200);
	assert.equal((await request(buildApp()).get("/api/content/news/hidden")).status, 404);
	assert.equal((await request(buildApp()).get("/api/content/event/live")).status, 404);
	assert.equal((await request(buildApp()).get("/api/content/blog/live")).status, 400);
});

function writePdf(fileKey) {
	fs.writeFileSync(path.join(process.env.RESOURCE_FILES_DIR, fileKey), "%PDF-1.4\n%test\n");
}

test("ungated resources download without a token", async () => {
	writePdf("10-1.pdf");
	await make({ kind: "resource", slug: "open", resourceType: "guide", fileKey: "10-1.pdf", gated: false });
	const res = await request(buildApp()).get("/api/content/resource/open/download");
	assert.equal(res.status, 200);
	assert.match(res.headers["content-type"], /application\/pdf/);
	assert.match(res.headers["content-disposition"], /attachment; filename="open\.pdf"/);
	assert.match(res.headers["cache-control"], /no-store/);
});

test("gated resources need a valid token for that resource", async () => {
	writePdf("10-2.pdf");
	writePdf("10-3.pdf");
	const a = await make({ kind: "resource", slug: "gated-a", resourceType: "guide", fileKey: "10-2.pdf" });
	const b = await make({ kind: "resource", slug: "gated-b", resourceType: "guide", fileKey: "10-3.pdf" });
	const app = buildApp();
	const message = "This download link has expired. Please request the resource again.";

	const none = await request(app).get("/api/content/resource/gated-a/download");
	assert.equal(none.status, 403);
	assert.equal(none.body.message, message);

	const wrong = await request(app).get(`/api/content/resource/gated-a/download?token=${signDownloadToken(b.id)}`);
	assert.equal(wrong.status, 403);

	const ok = await request(app).get(`/api/content/resource/gated-a/download?token=${signDownloadToken(a.id)}`);
	assert.equal(ok.status, 200);

	await prisma.contentItem.update({ where: { id: a.id }, data: { published: false } });
	const unpublished = await request(app).get(`/api/content/resource/gated-a/download?token=${signDownloadToken(a.id)}`);
	assert.equal(unpublished.status, 404);
});

test("a missing file gives a clear 404", async () => {
	await make({ kind: "resource", slug: "gone", resourceType: "guide", fileKey: "99-9.pdf", gated: false });
	const res = await request(buildApp()).get("/api/content/resource/gone/download");
	assert.equal(res.status, 404);
	assert.equal(res.body.message, "This file is no longer available.");
});

test("stored PDFs are not reachable any other way", async () => {
	writePdf("10-4.pdf");
	const app = require("../app")();
	assert.equal((await request(app).get("/uploads/10-4.pdf")).status, 404);
	assert.equal((await request(app).get("/private/resources/10-4.pdf")).status, 404);
});
