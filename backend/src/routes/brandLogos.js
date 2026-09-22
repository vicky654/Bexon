const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/", async (req, res) => {
	const logos = await prisma.brandLogo.findMany({
		orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
	});
	res.json({ logos });
});

module.exports = router;
