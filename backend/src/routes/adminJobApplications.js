const express = require("express");
const prisma = require("../lib/prisma");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.use(requireAdmin);

const JOB_SELECT = { select: { id: true, title: true } };
const VALID_STATUSES = new Set(["new", "reviewed", "shortlisted", "rejected"]);

router.get("/", async (req, res) => {
	const applications = await prisma.jobApplication.findMany({
		orderBy: { createdAt: "desc" },
		include: { job: JOB_SELECT },
	});
	res.json({ applications });
});

router.get("/:id", async (req, res) => {
	const application = await prisma.jobApplication.findUnique({
		where: { id: Number(req.params.id) },
		include: { job: JOB_SELECT },
	});

	if (!application) {
		return res.status(404).json({ message: "Application not found." });
	}

	res.json({ application });
});

router.put("/:id", async (req, res) => {
	const id = Number(req.params.id);
	const existing = await prisma.jobApplication.findUnique({ where: { id } });

	if (!existing) {
		return res.status(404).json({ message: "Application not found." });
	}

	const { status } = req.body || {};
	if (status !== undefined && !VALID_STATUSES.has(status)) {
		return res.status(400).json({ message: "Invalid status." });
	}

	const application = await prisma.jobApplication.update({
		where: { id },
		data: { status: status ?? existing.status },
		include: { job: JOB_SELECT },
	});

	res.json({ application });
});

router.delete("/:id", async (req, res) => {
	const id = Number(req.params.id);
	const existing = await prisma.jobApplication.findUnique({ where: { id } });

	if (!existing) {
		return res.status(404).json({ message: "Application not found." });
	}

	await prisma.jobApplication.delete({ where: { id } });
	res.json({ message: "Application deleted." });
});

module.exports = router;
