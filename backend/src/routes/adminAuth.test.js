const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");

const testDbPath = path.join(__dirname, "../../data/test-admin-auth.db");
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
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const adminAuthRouter = require("./adminAuth");
const { COOKIE_NAME } = require("../lib/auth");

function buildApp() {
	const app = express();
	app.use(express.json());
	app.use(cookieParser());
	app.use("/api/admin", adminAuthRouter);
	return app;
}

test("logs in with correct credentials and sets a cookie", async t => {
	const passwordHash = await bcrypt.hash("correct-password", 10);
	await prisma.admin.create({ data: { email: "admin@example.com", passwordHash } });

	t.after(async () => {
		await prisma.admin.deleteMany();
	});

	const res = await request(buildApp())
		.post("/api/admin/login")
		.send({ email: "admin@example.com", password: "correct-password" });

	assert.equal(res.status, 200);
	assert.ok(res.headers["set-cookie"]?.[0]?.includes(COOKIE_NAME));
});

test("rejects an incorrect password", async t => {
	const passwordHash = await bcrypt.hash("correct-password", 10);
	await prisma.admin.create({ data: { email: "admin2@example.com", passwordHash } });

	t.after(async () => {
		await prisma.admin.deleteMany();
	});

	const res = await request(buildApp())
		.post("/api/admin/login")
		.send({ email: "admin2@example.com", password: "wrong-password" });

	assert.equal(res.status, 401);
});

test("rejects an unknown email", async () => {
	const res = await request(buildApp())
		.post("/api/admin/login")
		.send({ email: "nobody@example.com", password: "whatever" });
	assert.equal(res.status, 401);
});

test("GET /me returns 401 with no cookie", async () => {
	const res = await request(buildApp()).get("/api/admin/me");
	assert.equal(res.status, 401);
});
