process.env.JWT_SECRET = "test-secret";

const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");
const requireAdmin = require("./requireAdmin");
const { signAdminToken, COOKIE_NAME } = require("../lib/auth");

function buildTestApp() {
	const app = express();
	app.use(cookieParser());
	app.get("/protected", requireAdmin, (req, res) => {
		res.json({ adminId: req.admin.adminId });
	});
	return app;
}

test("rejects requests with no cookie", async () => {
	const app = buildTestApp();
	const res = await request(app).get("/protected");
	assert.equal(res.status, 401);
});

test("rejects requests with an invalid cookie", async () => {
	const app = buildTestApp();
	const res = await request(app)
		.get("/protected")
		.set("Cookie", `${COOKIE_NAME}=not-a-real-token`);
	assert.equal(res.status, 401);
});

test("allows requests with a valid cookie", async () => {
	const app = buildTestApp();
	const token = signAdminToken({ id: 1, email: "admin@example.com" });
	const res = await request(app)
		.get("/protected")
		.set("Cookie", `${COOKIE_NAME}=${token}`);
	assert.equal(res.status, 200);
	assert.equal(res.body.adminId, 1);
});
