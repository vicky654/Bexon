const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const prisma = require("../lib/prisma");
const { sendJobApplicationNotification } = require("../lib/mailer");

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const resumesDir = path.join(__dirname, "../../public/uploads/resumes");
fs.mkdirSync(resumesDir, { recursive: true });

const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, resumesDir),
	filename: (req, file, cb) => {
		const safeExt = path.extname(file.originalname).toLowerCase();
		const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
		cb(null, safeName);
	},
});

const ALLOWED_RESUME_TYPES = new Set([
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const uploadResume = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		if (!ALLOWED_RESUME_TYPES.has(file.mimetype)) {
			return cb(new Error("Resume must be a PDF or Word document."));
		}
		cb(null, true);
	},
});

router.get("/", async (req, res) => {
	const jobs = await prisma.job.findMany({
		where: { published: true },
		orderBy: { createdAt: "desc" },
	});
	res.json({ jobs });
});

router.get("/:id", async (req, res) => {
	const id = Number(req.params.id);
	const job = await prisma.job.findUnique({ where: { id } });

	if (!job || !job.published) {
		return res.status(404).json({ message: "Job not found." });
	}

	res.json({ job });
});

router.post("/:id/apply", (req, res) => {
	uploadResume.single("resume")(req, res, async err => {
		if (err) {
			return res.status(400).json({ message: err.message });
		}

		const id = Number(req.params.id);
		const job = await prisma.job.findUnique({ where: { id } });

		if (!job || !job.published) {
			return res.status(404).json({ message: "Job not found." });
		}

		const { name, email, phone, coverLetter } = req.body || {};

		if (!name || !email) {
			return res.status(400).json({ message: "Name and email are required." });
		}

		if (!emailPattern.test(email)) {
			return res.status(400).json({ message: "Please provide a valid email address." });
		}

		const origin = `${req.protocol}://${req.get("host")}`;
		const resumeUrl = req.file ? `${origin}/uploads/resumes/${req.file.filename}` : "";

		const application = await prisma.jobApplication.create({
			data: {
				jobId: id,
				name,
				email,
				phone: phone || "",
				coverLetter: coverLetter || "",
				resumeUrl,
			},
		});

		try {
			await sendJobApplicationNotification({ job, name, email, phone, coverLetter, resumeUrl });
		} catch (error) {
			console.error("Job application notification email failed to send:", error.message);
		}

		res.status(201).json({ message: "Application submitted successfully.", id: application.id });
	});
});

module.exports = router;
