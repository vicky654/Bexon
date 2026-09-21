const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/", async (req, res) => {
	const settings = await prisma.siteSettings.upsert({
		where: { id: 1 },
		update: {},
		create: { id: 1 },
	});
	res.json({ settings });
});

module.exports = router;
