const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

const uploadsDir = path.join(__dirname, "../../public/uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, uploadsDir),
	filename: (req, file, cb) => {
		const safeExt = path.extname(file.originalname).toLowerCase();
		const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
		cb(null, safeName);
	},
});

const ALLOWED_MIME_TYPES = new Set([
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
	"image/svg+xml",
]);

const upload = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
			return cb(new Error("Only image files (png, jpg, webp, gif, svg) are allowed."));
		}
		cb(null, true);
	},
});

router.use(requireAdmin);

router.post("/", (req, res) => {
	upload.single("image")(req, res, err => {
		if (err) {
			return res.status(400).json({ message: err.message });
		}
		if (!req.file) {
			return res.status(400).json({ message: "No image file was uploaded." });
		}
		res.status(201).json({ url: `/uploads/${req.file.filename}` });
	});
});

module.exports = router;
