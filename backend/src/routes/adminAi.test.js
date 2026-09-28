process.env.JWT_SECRET = "test-secret";
delete process.env.ANTHROPIC_API_KEY;

const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");
const adminAiRouter = require("./adminAi");
const { signAdminToken, COOKIE_NAME } = require("../lib/auth");

function buildApp() {
	const app = express();
	app.use(express.json());
	app.use(cookieParser());
	app.use("/api/admin/ai", adminAiRouter);
	return app;
}

function authCookie() {
	const token = signAdminToken({ id: 1, email: "admin@example.com" });
	return `${COOKIE_NAME}=${token}`;
}

test("rejects requests with no auth cookie", async () => {
	const res = await request(buildApp())
		.post("/api/admin/ai/generate")
		.send({ type: "blog", prompt: "DPDP Act basics" });
	assert.equal(res.status, 401);
});

test("rejects an unknown type", async () => {
	const res = await request(buildApp())
		.post("/api/admin/ai/generate")
		.set("Cookie", authCookie())
		.send({ type: "poem", prompt: "DPDP Act basics" });
	assert.equal(res.status, 400);
});

test("rejects a missing prompt", async () => {
	const res = await request(buildApp())
		.post("/api/admin/ai/generate")
		.set("Cookie", authCookie())
		.send({ type: "blog", prompt: "   " });
	assert.equal(res.status, 400);
});

test("returns 503 when ANTHROPIC_API_KEY is not configured", async () => {
	const res = await request(buildApp())
		.post("/api/admin/ai/generate")
		.set("Cookie", authCookie())
		.send({ type: "job", prompt: "Senior privacy consultant" });
	assert.equal(res.status, 503);
});

const VALID_PALETTE = {
	primaryColor: "#0b3d5c",
	secondaryColor: "#0a1f2e",
	hoverColor: "#125a85",
	textColor: "#3c4a52",
	headingColor: "#0a1f2e",
	backgroundColor: "#e6f1f5",
};

function paletteMessage(palette) {
	return { stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(palette) }] };
}

// Replaces the Anthropic client with one that returns the given responses in
// order, and records every request it receives.
function stubClient(...responses) {
	const calls = [];
	adminAiRouter._setClientForTests({
		beta: {
			messages: {
				create: async params => {
					calls.push(params);
					const next = responses[Math.min(calls.length - 1, responses.length - 1)];
					if (next instanceof Error) throw next;
					return next;
				},
			},
		},
	});
	return calls;
}

function postColors(body) {
	return request(buildApp()).post("/api/admin/ai/colors").set("Cookie", authCookie()).send(body);
}

test("colors: rejects requests with no auth cookie", async () => {
	const res = await request(buildApp()).post("/api/admin/ai/colors").send({ prompt: "calm blue" });
	assert.equal(res.status, 401);
});

test("colors: rejects a missing or overlong prompt", async () => {
	assert.equal((await postColors({ prompt: "  " })).status, 400);
	assert.equal((await postColors({ prompt: "x".repeat(301) })).status, 400);
});

test("colors: returns 503 when ANTHROPIC_API_KEY is not configured", async () => {
	adminAiRouter._setClientForTests(null);
	const res = await postColors({ prompt: "calm blue" });
	assert.equal(res.status, 503);
});

test("colors: returns a readable palette from the AI", async () => {
	const calls = stubClient(paletteMessage(VALID_PALETTE));
	try {
		const res = await postColors({ prompt: "calm, trustworthy blue" });
		assert.equal(res.status, 200);
		assert.deepEqual(res.body, { palette: VALID_PALETTE });
		assert.equal(calls.length, 1);
		assert.equal(calls[0].model, "claude-opus-5");
		assert.equal(calls[0].output_config.format.type, "json_schema");
		assert.match(calls[0].messages[0].content, /calm, trustworthy blue/);
	} finally {
		adminAiRouter._setClientForTests(null);
	}
});

test("colors: retries once with feedback when the first palette is unreadable", async () => {
	const unreadable = { ...VALID_PALETTE, textColor: "#dddddd" };
	const calls = stubClient(paletteMessage(unreadable), paletteMessage(VALID_PALETTE));
	try {
		const res = await postColors({ prompt: "soft pastel" });
		assert.equal(res.status, 200);
		assert.deepEqual(res.body.palette, VALID_PALETTE);
		assert.equal(calls.length, 2);
		const retryMessages = calls[1].messages;
		assert.equal(retryMessages.at(-1).role, "user");
		assert.match(retryMessages.at(-1).content, /textColor/);
	} finally {
		adminAiRouter._setClientForTests(null);
	}
});

test("colors: returns 422 when both attempts are unreadable or malformed", async () => {
	const calls = stubClient(
		paletteMessage({ ...VALID_PALETTE, primaryColor: "#ffee99" }),
		paletteMessage({ ...VALID_PALETTE, headingColor: "navy" })
	);
	try {
		const res = await postColors({ prompt: "sunny yellow" });
		assert.equal(res.status, 422);
		assert.match(res.body.message, /readable/);
		assert.equal(calls.length, 2);
	} finally {
		adminAiRouter._setClientForTests(null);
	}
});

test("colors: returns 502 on a refusal or an API error", async () => {
	stubClient({ stop_reason: "refusal", content: [] });
	try {
		assert.equal((await postColors({ prompt: "anything" })).status, 502);
		stubClient(new Error("network down"));
		assert.equal((await postColors({ prompt: "anything" })).status, 502);
	} finally {
		adminAiRouter._setClientForTests(null);
	}
});
