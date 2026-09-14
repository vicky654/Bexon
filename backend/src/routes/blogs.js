const express = require("express");
const prisma = require("../lib/prisma");
const { mapBlogToLegacyShape } = require("../lib/adapter");
const makePath = require("../lib/makePath");

const router = express.Router();

router.get("/", async (req, res) => {
	const { category, tag, author_role: authorRole, search } = req.query;

	const blogs = await prisma.blog.findMany({
		where: { published: true },
		orderBy: { publishedAt: "desc" },
	});

	let mapped = blogs.map(mapBlogToLegacyShape);

	if (category) {
		mapped = mapped.filter(blog => makePath(blog.category) === category);
	} else if (tag) {
		const target = tag.toLowerCase();
		mapped = mapped.filter(blog =>
			blog.tags.map(t => t.toLowerCase()).includes(target)
		);
	} else if (authorRole) {
		mapped = mapped.filter(blog => makePath(blog.author_role) === authorRole);
	} else if (search) {
		const pattern = new RegExp(search, "i");
		mapped = mapped.filter(blog => pattern.test(blog.title));
	}

	res.json({ blogs: mapped });
});

router.get("/:slug", async (req, res) => {
	const blog = await prisma.blog.findUnique({
		where: { slug: req.params.slug },
	});

	if (!blog || !blog.published) {
		return res.status(404).json({ message: "Blog not found" });
	}

	res.json({ blog: mapBlogToLegacyShape(blog) });
});

module.exports = router;
