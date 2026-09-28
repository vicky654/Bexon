const test = require("node:test");
const assert = require("node:assert/strict");
const {
	CONTACT_TOPICS,
	deviceTypeFromUserAgent,
	clientIp,
	isTestAddress,
	createRateLimiter,
} = require("./contactHelpers");

test("has the ten purposes from the old site", () => {
	assert.equal(Object.keys(CONTACT_TOPICS).length, 10);
	assert.equal(CONTACT_TOPICS.dpo_service, "Data Protection Officer as a Service");
});

test("detects device type from the user agent", () => {
	assert.equal(deviceTypeFromUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148"), "Mobile");
	assert.equal(deviceTypeFromUserAgent("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)"), "Tablet");
	assert.equal(deviceTypeFromUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"), "Desktop");
	assert.equal(deviceTypeFromUserAgent(undefined), "Desktop");
});

test("clientIp prefers the first forwarded address", () => {
	const req = { get: name => (name === "x-forwarded-for" ? "5.6.7.8, 10.0.0.1" : undefined), socket: { remoteAddress: "::1" } };
	assert.equal(clientIp(req), "5.6.7.8");
	const direct = { get: () => undefined, socket: { remoteAddress: "::1" } };
	assert.equal(clientIp(direct), "::1");
});

test("flags yopmail and company addresses as test addresses", () => {
	assert.equal(isTestAddress("someone@yopmail.com"), true);
	assert.equal(isTestAddress("Staff@DPDPConsultants.com"), true);
	assert.equal(isTestAddress("client@example.com"), false);
});

test("rate limiter allows max hits per key within the window", () => {
	const allow = createRateLimiter({ max: 2, windowMs: 60_000 });
	assert.equal(allow("a"), true);
	assert.equal(allow("a"), true);
	assert.equal(allow("a"), false);
	assert.equal(allow("b"), true);
});

test("sweeps expired keys from the map when size exceeds 1000", () => {
	const originalDateNow = Date.now;
	let currentTime = 0;
	Date.now = () => currentTime;

	try {
		const allow = createRateLimiter({ max: 1, windowMs: 100 });

		// (a) Hit 1001 distinct keys to trigger the sweep threshold
		for (let i = 0; i < 1001; i++) {
			assert.equal(allow(`key-${i}`), true);
		}
		assert.equal(allow.size(), 1001, "Map should have 1001 entries after hitting 1001 distinct keys");

		// (b) Advance time past the window and trigger sweep with a fresh key
		currentTime = 150;
		assert.equal(allow("fresh-key"), true);
		// After sweep, only fresh-key should remain (all 1001 expired keys removed)
		assert.equal(allow.size(), 1, "After sweep, only fresh-key should remain in the map");

		// (c) Test small map: hit key "a", advance time, hit again
		currentTime = 0;
		const allow2 = createRateLimiter({ max: 1, windowMs: 100 });
		assert.equal(allow2("a"), true);
		assert.equal(allow2.size(), 1, "Map should have 1 entry after first hit");

		currentTime = 150; // Advance past window
		assert.equal(allow2("a"), true, "Expired key should be allowed again");
		assert.equal(allow2.size(), 1, "Size should stay 1, not 2 (old entry deleted, fresh hit added)");
	} finally {
		Date.now = originalDateNow;
	}
});
