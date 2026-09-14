const express = require("express");
const prisma = require("../lib/prisma");
const requireAdmin = require("../middleware/requireAdmin");
const { serializeAdminBlog } = require("../lib/adapter");

const router = express.Router();

router.use(requireAdmin);

router.get("/", async (req, res) => {
	const blogs = await prisma.blog.findMany({ orderBy: { publishedAt: "desc" } });
	res.json({ blogs: blogs.map(serializeAdminBlog) });
});

router.get("/:id", async (req, res) => {
	const blog = await prisma.blog.findUnique({ where: { id: Number(req.params.id) } });

	if (!blog) {
		return res.status(404).json({ message: "Blog not found." });
	}

	res.json({ blog: serializeAdminBlog(blog) });
});

router.post("/", async (req, res) => {
	const {
		title,
		slug,
		excerpt,
		content,
		img,
		category,
		tags,
		author,
		authorRole,
		status,
		published,
	} = req.body || {};

	if (!title || !slug) {
		return res.status(400).json({ message: "Title and slug are required." });
	}

	const existing = await prisma.blog.findUnique({ where: { slug } });
	if (existing) {
		return res.status(400).json({ message: "A blog with this slug already exists." });
	}

	const blog = await prisma.blog.create({
		data: {
			title,
			slug,
			excerpt: excerpt || "",
			content: content || "",
			img: img || "",
			category: category || "",
			tags: JSON.stringify(tags || []),
			author: author || "",
			authorRole: authorRole || "",
			status: status || "",
			published: published !== undefined ? published : true,
		},
	});

	res.status(201).json({ blog: serializeAdminBlog(blog) });
});

router.put("/:id", async (req, res) => {
	const id = Number(req.params.id);
	const existing = await prisma.blog.findUnique({ where: { id } });

	if (!existing) {
		return res.status(404).json({ message: "Blog not found." });
	}

	const {
		title,
		slug,
		excerpt,
		content,
		img,
		category,
		tags,
		author,
		authorRole,
		status,
		published,
	} = req.body || {};

	if (slug && slug !== existing.slug) {
		const slugTaken = await prisma.blog.findUnique({ where: { slug } });
		if (slugTaken) {
			return res.status(400).json({ message: "A blog with this slug already exists." });
		}
	}

	const blog = await prisma.blog.update({
		where: { id },
		data: {
			title: title ?? existing.title,
			slug: slug ?? existing.slug,
			excerpt: excerpt ?? existing.excerpt,
			content: content ?? existing.content,
			img: img ?? existing.img,
			category: category ?? existing.category,
			tags: tags !== undefined ? JSON.stringify(tags) : existing.tags,
			author: author ?? existing.author,
			authorRole: authorRole ?? existing.authorRole,
			status: status ?? existing.status,
			published: published !== undefined ? published : existing.published,
		},
	});

	res.json({ blog: serializeAdminBlog(blog) });
});

router.delete("/:id", async (req, res) => {
	const id = Number(req.params.id);
	const existing = await prisma.blog.findUnique({ where: { id } });

	if (!existing) {
		return res.status(404).json({ message: "Blog not found." });
	}

	await prisma.blog.delete({ where: { id } });
	res.json({ message: "Blog deleted." });
});

module.exports = router;
