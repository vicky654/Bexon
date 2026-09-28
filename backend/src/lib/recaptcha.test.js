const test = require("node:test");
const assert = require("node:assert/strict");
const recaptcha = require("./recaptcha");

test("passes when no secret is configured", async () => {
	delete process.env.RECAPTCHA_SECRET;
	assert.equal(await recaptcha.verifyRecaptcha("", "1.2.3.4"), true);
});

test("rejects an empty token when a secret is configured", async () => {
	process.env.RECAPTCHA_SECRET = "secret";
	try {
		assert.equal(await recaptcha.verifyRecaptcha("", "1.2.3.4"), false);
	} finally {
		delete process.env.RECAPTCHA_SECRET;
	}
});

test("returns Google's success flag", async () => {
	process.env.RECAPTCHA_SECRET = "secret";
	const originalFetch = global.fetch;
	let sent;
	global.fetch = async (url, init) => {
		sent = { url, body: new URLSearchParams(init.body.toString()) };
		return new Response(JSON.stringify({ success: true }));
	};
	try {
		assert.equal(await recaptcha.verifyRecaptcha("tok", "1.2.3.4"), true);
		assert.equal(sent.url, "https://www.google.com/recaptcha/api/siteverify");
		assert.equal(sent.body.get("secret"), "secret");
		assert.equal(sent.body.get("response"), "tok");
		assert.equal(sent.body.get("remoteip"), "1.2.3.4");

		global.fetch = async () => new Response(JSON.stringify({ success: false }));
		assert.equal(await recaptcha.verifyRecaptcha("tok", "1.2.3.4"), false);

		global.fetch = async () => {
			throw new Error("network down");
		};
		assert.equal(await recaptcha.verifyRecaptcha("tok", "1.2.3.4"), false);
	} finally {
		global.fetch = originalFetch;
		delete process.env.RECAPTCHA_SECRET;
	}
});
