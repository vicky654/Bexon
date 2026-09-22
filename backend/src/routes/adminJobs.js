const express = require("express");
const prisma = require("../lib/prisma");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.use(requireAdmin);

router.get("/", async (req, res) => {
	const jobs = await prisma.job.findMany({ orderBy: { createdAt: "desc" } });
	res.json({ jobs });
});

router.get("/:id", async (req, res) => {
	const job = await prisma.job.findUnique({ where: { id: Number(req.params.id) } });

	if (!job) {
		return res.status(404).json({ message: "Job not found." });
	}

	res.json({ job });
});

router.post("/", async (req, res) => {
	const {
		title,
		department,
		location,
		type,
		salaryRange,
		salaryPeriod,
		description,
		requirements,
		published,
	} = req.body || {};

	if (!title) {
		return res.status(400).json({ message: "Title is required." });
	}

	const job = await prisma.job.create({
		data: {
			title,
			department: department || "",
			location: location || "",
			type: type || "",
			salaryRange: salaryRange || "",
			salaryPeriod: salaryPeriod || "",
			description: description || "",
			requirements: requirements || "",
			published: published !== undefined ? published : true,
		},
	});

	res.status(201).json({ job });
});

router.put("/:id", async (req, res) => {
	const id = Number(req.params.id);
	const existing = await prisma.job.findUnique({ where: { id } });

	if (!existing) {
		return res.status(404).json({ message: "Job not found." });
	}

	const {
		title,
		department,
		location,
		type,
		salaryRange,
		salaryPeriod,
		description,
		requirements,
		published,
	} = req.body || {};

	const job = await prisma.job.update({
		where: { id },
		data: {
			title: title ?? existing.title,
			department: department ?? existing.department,
			location: location ?? existing.location,
			type: type ?? existing.type,
			salaryRange: salaryRange ?? existing.salaryRange,
			salaryPeriod: salaryPeriod ?? existing.salaryPeriod,
			description: description ?? existing.description,
			requirements: requirements ?? existing.requirements,
			published: published !== undefined ? published : existing.published,
		},
	});

	res.json({ job });
});

router.delete("/:id", async (req, res) => {
	const id = Number(req.params.id);
	const existing = await prisma.job.findUnique({ where: { id } });

	if (!existing) {
		return res.status(404).json({ message: "Job not found." });
	}

	await prisma.job.delete({ where: { id } });
	res.json({ message: "Job deleted." });
});

module.exports = router;
