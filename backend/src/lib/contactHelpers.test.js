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

		// Hit 1001 distinct keys to trigger the sweep threshold
		for (let i = 0; i < 1001; i++) {
			assert.equal(allow(`key-${i}`), true);
		}

		// Advance time past the window so all hits expire
		currentTime = 150;

		// Make a new call, which triggers the sweep and cleans expired entries
		assert.equal(allow("trigger-sweep"), true);

		// Old keys should now be accessible again because they were evicted
		// If they weren't evicted, the next call would return false (rate limited)
		assert.equal(allow("key-0"), true);
		assert.equal(allow("key-500"), true);

		// Verify these keys can be limited again (the hits were cleared)
		assert.equal(allow("key-0"), false); // Second hit should be blocked
		assert.equal(allow("key-500"), false); // Second hit should be blocked
	} finally {
		Date.now = originalDateNow;
	}
});
