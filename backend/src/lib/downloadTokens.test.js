const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "admin-secret-for-tests";
delete process.env.DOWNLOAD_TOKEN_SECRET;
const { signDownloadToken, verifyDownloadToken } = require("./downloadTokens");

test("a fresh token verifies for its own resource only", () => {
	const token = signDownloadToken(7);
	assert.equal(verifyDownloadToken(token, 7), true);
	assert.equal(verifyDownloadToken(token, 8), false);
});

test("tampered, expired, wrong-purpose and missing tokens fail", () => {
	const token = signDownloadToken(7);
	assert.equal(verifyDownloadToken(`${token}x`, 7), false);
	assert.equal(verifyDownloadToken("", 7), false);
	assert.equal(verifyDownloadToken(undefined, 7), false);

	const secret = "admin-secret-for-tests:resource-download";
	const expired = jwt.sign({ purpose: "resource-download", contentId: 7, exp: Math.floor(Date.now() / 1000) - 10 }, secret);
	assert.equal(verifyDownloadToken(expired, 7), false);
	const wrongPurpose = jwt.sign({ purpose: "admin", contentId: 7 }, secret, { expiresIn: 60 });
	assert.equal(verifyDownloadToken(wrongPurpose, 7), false);
});

test("tokens are not signed with the bare admin secret", () => {
	const token = signDownloadToken(7);
	assert.throws(() => jwt.verify(token, "admin-secret-for-tests"));
});

test("token lifetime is 15 minutes", () => {
	const { exp, iat } = jwt.decode(signDownloadToken(7));
	assert.equal(exp - iat, 15 * 60);
});
