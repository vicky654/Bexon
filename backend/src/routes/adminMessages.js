const express = require("express");
const prisma = require("../lib/prisma");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.use(requireAdmin);

router.get("/", async (req, res) => {
	const messages = await prisma.contactSubmission.findMany({
		orderBy: { createdAt: "desc" },
	});
	res.json({ messages });
});

router.patch("/:id", async (req, res) => {
	const id = Number(req.params.id);
	const existing = await prisma.contactSubmission.findUnique({ where: { id } });

	if (!existing) {
		return res.status(404).json({ message: "Submission not found." });
	}

	const { status } = req.body || {};
	const nextStatus = status === "new" ? "new" : "read";

	const message = await prisma.contactSubmission.update({
		where: { id },
		data: { status: nextStatus },
	});

	res.json({ message });
});

module.exports = router;
