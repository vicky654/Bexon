const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");

const testDbPath = path.join(__dirname, "../../data/test-admin-messages.db");
process.env.DATABASE_URL = `file:${testDbPath}`;
process.env.JWT_SECRET = "test-secret";

if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
execSync("npx prisma db push --skip-generate --schema=./prisma/schema.prisma", {
	cwd: path.join(__dirname, "../.."),
	stdio: "inherit",
	env: process.env,
});

const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");
const prisma = require("../lib/prisma");
const adminMessagesRouter = require("./adminMessages");
const { signAdminToken, COOKIE_NAME } = require("../lib/auth");

function buildApp() {
	const app = express();
	app.use(express.json());
	app.use(cookieParser());
	app.use("/api/admin/messages", adminMessagesRouter);
	return app;
}

function authCookie() {
	const token = signAdminToken({ id: 1, email: "admin@example.com" });
	return `${COOKIE_NAME}=${token}`;
}

test("rejects requests with no auth cookie", async () => {
	const res = await request(buildApp()).get("/api/admin/messages");
	assert.equal(res.status, 401);
});

test("lists submissions and marks one as read", async t => {
	const submission = await prisma.contactSubmission.create({
		data: { name: "Jane", email: "jane@example.com", message: "Hi there" },
	});

	t.after(async () => {
		await prisma.contactSubmission.deleteMany();
	});

	const app = buildApp();

	const listRes = await request(app)
		.get("/api/admin/messages")
		.set("Cookie", authCookie());
	assert.equal(listRes.status, 200);
	assert.equal(listRes.body.messages[0].status, "new");

	const patchRes = await request(app)
		.patch(`/api/admin/messages/${submission.id}`)
		.set("Cookie", authCookie())
		.send({ status: "read" });
	assert.equal(patchRes.status, 200);
	assert.equal(patchRes.body.message.status, "read");
});

test("PATCH on an unknown id returns 404", async () => {
	const res = await request(buildApp())
		.patch("/api/admin/messages/999999")
		.set("Cookie", authCookie())
		.send({ status: "read" });
	assert.equal(res.status, 404);
});
