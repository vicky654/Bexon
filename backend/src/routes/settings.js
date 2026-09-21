const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/", async (req, res) => {
	let settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
	if (!settings) {
		settings = await prisma.siteSettings.create({ data: { id: 1 } });
	}
	res.json({ settings });
});

module.exports = router;
