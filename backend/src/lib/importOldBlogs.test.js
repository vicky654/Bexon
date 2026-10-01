const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");

const testDbPath = path.join(__dirname, "../../data/test-import-old-blogs.db");
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
const { importOldBlogs } = require("../../scripts/import-old-blogs");

const DATA = path.join(__dirname, "../../prisma/data/old-site-blogs.json");
const SITE_PUBLIC = path.join(__dirname, "../../../public");
const posts = JSON.parse(fs.readFileSync(DATA, "utf8"));

test("old-site blog data is complete and points at files the website ships", () => {
	assert.equal(posts.length, 90);
	const slugs = new Set(posts.map(p => p.slug));
	assert.equal(slugs.size, posts.length, "slugs must be unique");
	for (const post of posts) {
		assert.ok(post.title && post.content && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(post.slug), `post ${post.oldId}`);
		assert.ok(post.img && fs.existsSync(path.join(SITE_PUBLIC, post.img)), `cover for ${post.oldId}`);
		for (const [, src] of post.content.matchAll(/<img[^>]*src="([^"]+)"/g)) {
			assert.ok(src.startsWith("/images/blogs/") && fs.existsSync(path.join(SITE_PUBLIC, src)), `${post.oldId}: ${src}`);
		}
		assert.ok(!/dpdpconsultants\.com\/[^"]*\.php/.test(post.content), `${post.oldId} still links to an old .php page`);
		assert.ok(!/<script|on\w+=|javascript:/i.test(post.content), `${post.oldId} has unsafe markup`);
	}
});

test("imports every post as an unpublished draft and is safe to re-run", async t => {
	t.after(async () => {
		await prisma.blog.deleteMany();
	});
	const first = await importOldBlogs({ file: DATA });
	assert.deepEqual(first, { created: 90, updated: 0, skipped: 0 });
	assert.equal(await prisma.blog.count({ where: { published: false } }), 90);

	const sample = await prisma.blog.findUnique({ where: { slug: posts[0].slug } });
	assert.equal(sample.title, posts[0].title);
	assert.equal(sample.metaTitle, posts[0].metaTitle || "");
	assert.equal(sample.imgAlt, posts[0].imgAlt || "");

	const again = await importOldBlogs({ file: DATA });
	assert.deepEqual(again, { created: 0, updated: 0, skipped: 90 });
});
