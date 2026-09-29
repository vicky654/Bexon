const express = require("express");
const prisma = require("../lib/prisma");
const requireAdmin = require("../middleware/requireAdmin");
const { isKind, validateContent, normalizeContent } = require("../lib/contentItems");
const { deleteResourceFile } = require("../lib/resourceFiles");

const router = express.Router();
router.use(requireAdmin);

const DUPLICATE_MESSAGE = "An item with this slug already exists.";

async function findItem(id) {
	const numericId = Number(id);
	if (!Number.isInteger(numericId)) return null;
	return prisma.contentItem.findUnique({ where: { id: numericId } });
}

router.get("/", async (req, res) => {
	const where = isKind(req.query.kind) ? { kind: req.query.kind } : {};
	const items = await prisma.contentItem.findMany({ where, orderBy: { updatedAt: "desc" } });
	res.json({ items });
});

router.get("/:id", async (req, res) => {
	const item = await findItem(req.params.id);
	if (!item) return res.status(404).json({ message: "Item not found." });
	res.json({ item });
});

router.post("/", async (req, res) => {
	const body = req.body || {};
	const error = validateContent(body.kind, body);
	if (error) return res.status(400).json({ message: error });
	const data = normalizeContent(body.kind, body);

	const clash = await prisma.contentItem.findUnique({ where: { kind_slug: { kind: data.kind, slug: data.slug } } });
	if (clash) return res.status(400).json({ message: DUPLICATE_MESSAGE });

	const item = await prisma.contentItem.create({ data });
	res.status(201).json({ item });
});

router.put("/:id", async (req, res) => {
	const existing = await findItem(req.params.id);
	if (!existing) return res.status(404).json({ message: "Item not found." });

	// The kind of an existing item never changes.
	const body = { ...(req.body || {}), kind: existing.kind };
	const error = validateContent(existing.kind, body);
	if (error) return res.status(400).json({ message: error });
	const data = normalizeContent(existing.kind, body);

	const clash = await prisma.contentItem.findUnique({ where: { kind_slug: { kind: data.kind, slug: data.slug } } });
	if (clash && clash.id !== existing.id) return res.status(400).json({ message: DUPLICATE_MESSAGE });

	const item = await prisma.contentItem.update({ where: { id: existing.id }, data });
	if (existing.fileKey && existing.fileKey !== item.fileKey) deleteResourceFile(existing.fileKey);
	res.json({ item });
});

router.delete("/:id", async (req, res) => {
	const existing = await findItem(req.params.id);
	if (!existing) return res.status(404).json({ message: "Item not found." });
	await prisma.contentItem.delete({ where: { id: existing.id } });
	deleteResourceFile(existing.fileKey);
	res.json({ ok: true });
});

module.exports = router;
