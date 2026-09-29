const jwt = require("jsonwebtoken");

const PURPOSE = "resource-download";
const TTL_SECONDS = 15 * 60;

// Derived from, but never equal to, the admin JWT secret so a download token
// can't be replayed as an admin session cookie.
function secret() {
	return process.env.DOWNLOAD_TOKEN_SECRET || `${process.env.JWT_SECRET}:${PURPOSE}`;
}

function signDownloadToken(contentId) {
	return jwt.sign({ purpose: PURPOSE, contentId }, secret(), { algorithm: "HS256", expiresIn: TTL_SECONDS });
}

function verifyDownloadToken(token, contentId) {
	if (typeof token !== "string" || !token) return false;
	try {
		const payload = jwt.verify(token, secret(), { algorithms: ["HS256"] });
		return payload.purpose === PURPOSE && payload.contentId === contentId;
	} catch {
		return false;
	}
}

module.exports = { signDownloadToken, verifyDownloadToken };
