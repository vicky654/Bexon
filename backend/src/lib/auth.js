const jwt = require("jsonwebtoken");

const COOKIE_NAME = "admin_token";

function signAdminToken(admin) {
	return jwt.sign(
		{ adminId: admin.id, email: admin.email },
		process.env.JWT_SECRET,
		{ expiresIn: "7d" }
	);
}

function verifyAdminToken(token) {
	try {
		return jwt.verify(token, process.env.JWT_SECRET);
	} catch {
		return null;
	}
}

module.exports = { signAdminToken, verifyAdminToken, COOKIE_NAME };
