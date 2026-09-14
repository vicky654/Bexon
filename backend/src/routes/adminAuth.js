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

// Minimal in-memory rate limiter for the login route: a single-admin tool
// doesn't need a real dependency for this. Tracks failed attempts by a key
// (IP + email) in a rolling window, resetting on success.
const LOGIN_ATTEMPT_LIMIT = 10;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const failedLoginAttempts = new Map();

function loginRateLimitKey(req, email) {
	return `${req.ip || "unknown"}:${(email || "").toLowerCase()}`;
}

function isRateLimited(key) {
	const entry = failedLoginAttempts.get(key);
	if (!entry) return false;
	if (Date.now() - entry.firstAttemptAt > LOGIN_ATTEMPT_WINDOW_MS) {
		failedLoginAttempts.delete(key);
		return false;
	}
	return entry.count >= LOGIN_ATTEMPT_LIMIT;
}

function recordFailedLogin(key) {
	const entry = failedLoginAttempts.get(key);
	if (!entry || Date.now() - entry.firstAttemptAt > LOGIN_ATTEMPT_WINDOW_MS) {
		failedLoginAttempts.set(key, { count: 1, firstAttemptAt: Date.now() });
		return;
	}
	entry.count += 1;
}

function clearFailedLogins(key) {
	failedLoginAttempts.delete(key);
}

router.post("/login", async (req, res) => {
	const { email, password } = req.body || {};

	if (!email || !password) {
		return res.status(400).json({ message: "Email and password are required." });
	}

	const rateLimitKey = loginRateLimitKey(req, email);
	if (isRateLimited(rateLimitKey)) {
		return res
			.status(429)
			.json({ message: "Too many failed login attempts. Please try again later." });
	}

	const admin = await prisma.admin.findUnique({ where: { email } });
	if (!admin) {
		recordFailedLogin(rateLimitKey);
		return res.status(401).json({ message: "Invalid email or password." });
	}

	const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
	if (!passwordMatches) {
		recordFailedLogin(rateLimitKey);
		return res.status(401).json({ message: "Invalid email or password." });
	}

	clearFailedLogins(rateLimitKey);
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
