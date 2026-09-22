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
