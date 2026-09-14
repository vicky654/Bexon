const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { signAdminToken, verifyAdminToken, COOKIE_NAME } = require("../lib/auth");

const router = express.Router();

function cookieOptions() {
	const isProduction = process.env.NODE_ENV === "production";
	return {
		httpOnly: true,
		sameSite: isProduction ? "none" : "lax",
		secure: isProduction,
		maxAge: 7 * 24 * 60 * 60 * 1000,
	};
}

router.post("/login", async (req, res) => {
	const { email, password } = req.body || {};

	if (!email || !password) {
		return res.status(400).json({ message: "Email and password are required." });
	}

	const admin = await prisma.admin.findUnique({ where: { email } });
	if (!admin) {
		return res.status(401).json({ message: "Invalid email or password." });
	}

	const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
	if (!passwordMatches) {
		return res.status(401).json({ message: "Invalid email or password." });
	}

	const token = signAdminToken(admin);
	res.cookie(COOKIE_NAME, token, cookieOptions());
	res.json({ email: admin.email });
});

router.post("/logout", (req, res) => {
	res.clearCookie(COOKIE_NAME, cookieOptions());
	res.json({ message: "Logged out." });
});

router.get("/me", (req, res) => {
	const token = req.cookies?.[COOKIE_NAME];
	const payload = token ? verifyAdminToken(token) : null;

	if (!payload) {
		return res.status(401).json({ message: "Not authenticated." });
	}

	res.json({ email: payload.email });
});

module.exports = router;
