// Imports the blog posts copied from the old PHP website
// (prisma/data/old-site-blogs.json). New posts are unpublished drafts for
// review in Admin -> Blogs, or published straight away with --publish (the
// content was reviewed and published on the development site). Safe to
// re-run: posts whose slug already exists are skipped (pass --update to
// refresh their content instead; the published flag of existing posts is
// never changed).
//
//   node scripts/import-old-blogs.js [--publish] [--update]
const path = require("node:path");
const fs = require("node:fs");
const prisma = require("../src/lib/prisma");

const DATA = path.join(__dirname, "../prisma/data/old-site-blogs.json");

function toRecord(post) {
	return {
		slug: post.slug,
		title: post.title,
		metaTitle: post.metaTitle || "",
		excerpt: post.excerpt || "",
		content: post.content,
		img: post.img || "",
		imgAlt: post.imgAlt || "",
		category: "",
		tags: "[]",
		author: post.author || "DPDP Consultants",
		authorRole: "",
		status: "",
		publishedAt: post.publishedAt ? new Date(`${post.publishedAt}T00:00:00.000Z`) : new Date(),
	};
}

async function importOldBlogs({ update = false, publish = false, file = DATA } = {}) {
	const posts = JSON.parse(fs.readFileSync(file, "utf8"));
	const result = { created: 0, updated: 0, skipped: 0 };
	for (const post of posts) {
		const record = toRecord(post);
		const existing = await prisma.blog.findUnique({ where: { slug: record.slug } });
		if (!existing) {
			await prisma.blog.create({ data: { ...record, published: publish } });
			result.created++;
		} else if (update) {
			await prisma.blog.update({ where: { slug: record.slug }, data: record });
			result.updated++;
		} else {
			result.skipped++;
		}
	}
	return result;
}

if (require.main === module) {
	const publish = process.argv.includes("--publish");
	importOldBlogs({ update: process.argv.includes("--update"), publish })
		.then(result => {
			console.log(`Old blog import: ${result.created} created (${publish ? "published" : "as drafts"}), ${result.updated} updated, ${result.skipped} skipped.`);
		})
		.catch(error => {
			console.error(error);
			process.exitCode = 1;
		})
		.finally(() => prisma.$disconnect());
}

module.exports = { importOldBlogs, toRecord };
