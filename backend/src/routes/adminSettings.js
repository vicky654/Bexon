const express = require("express");
const prisma = require("../lib/prisma");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.use(requireAdmin);

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const COLOR_FIELDS = [
	"primaryColor",
	"secondaryColor",
	"hoverColor",
	"textColor",
	"headingColor",
	"backgroundColor",
];

router.put("/", async (req, res) => {
	const body = req.body || {};

	for (const field of COLOR_FIELDS) {
		if (typeof body[field] !== "string" || !HEX_COLOR.test(body[field])) {
			return res.status(400).json({ message: `${field} must be a hex color like #02092c.` });
		}
	}

	const data = {};
	for (const field of COLOR_FIELDS) data[field] = body[field];

	const settings = await prisma.siteSettings.upsert({
		where: { id: 1 },
		update: data,
		create: { id: 1, ...data },
	});

	res.json({ settings });
});

module.exports = router;
