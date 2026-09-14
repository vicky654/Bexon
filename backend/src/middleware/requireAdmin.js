const { verifyAdminToken, COOKIE_NAME } = require("../lib/auth");

function requireAdmin(req, res, next) {
	const token = req.cookies?.[COOKIE_NAME];
	const payload = token ? verifyAdminToken(token) : null;

	if (!payload) {
		return res.status(401).json({ message: "Not authenticated." });
	}

	req.admin = payload;
	next();
}

module.exports = requireAdmin;
