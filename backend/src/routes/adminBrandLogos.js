const express = require("express");
const prisma = require("../lib/prisma");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.use(requireAdmin);

router.get("/", async (req, res) => {
	const logos = await prisma.brandLogo.findMany({
		orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
	});
	res.json({ logos });
});

router.post("/", async (req, res) => {
	const { imageUrl, alt } = req.body || {};

	if (!imageUrl || typeof imageUrl !== "string") {
		return res.status(400).json({ message: "imageUrl is required." });
	}

	const last = await prisma.brandLogo.findFirst({ orderBy: { sortOrder: "desc" } });
	const sortOrder = last ? last.sortOrder + 1 : 0;

	const logo = await prisma.brandLogo.create({
		data: { imageUrl, alt: alt || "", sortOrder },
	});

	res.status(201).json({ logo });
});

router.put("/reorder", async (req, res) => {
	const { ids } = req.body || {};

	if (!Array.isArray(ids) || !ids.every(id => Number.isInteger(id))) {
		return res.status(400).json({ message: "ids must be an array of logo ids." });
	}

	await prisma.$transaction(
		ids.map((id, index) => prisma.brandLogo.update({ where: { id }, data: { sortOrder: index } }))
	);

	const logos = await prisma.brandLogo.findMany({
		orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
	});
	res.json({ logos });
});

router.put("/:id", async (req, res) => {
	const id = Number(req.params.id);
	const existing = await prisma.brandLogo.findUnique({ where: { id } });

	if (!existing) {
		return res.status(404).json({ message: "Logo not found." });
	}

	const { alt } = req.body || {};
	const logo = await prisma.brandLogo.update({
		where: { id },
		data: { alt: alt !== undefined ? alt : existing.alt },
	});

	res.json({ logo });
});

router.delete("/:id", async (req, res) => {
	const id = Number(req.params.id);
	const existing = await prisma.brandLogo.findUnique({ where: { id } });

	if (!existing) {
		return res.status(404).json({ message: "Logo not found." });
	}

	await prisma.brandLogo.delete({ where: { id } });
	res.json({ message: "Logo deleted." });
});

module.exports = router;
