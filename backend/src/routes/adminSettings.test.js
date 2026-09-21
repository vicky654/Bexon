const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");

const testDbPath = path.join(__dirname, "../../data/test-admin-settings.db");
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
const adminSettingsRouter = require("./adminSettings");
const { signAdminToken, COOKIE_NAME } = require("../lib/auth");

function buildApp() {
	const app = express();
	app.use(express.json());
	app.use(cookieParser());
	app.use("/api/admin/settings", adminSettingsRouter);
	return app;
}

function authCookie() {
	const token = signAdminToken({ id: 1, email: "admin@example.com" });
	return `${COOKIE_NAME}=${token}`;
}

const VALID_BODY = {
	primaryColor: "#111111",
	secondaryColor: "#222222",
	hoverColor: "#333333",
	textColor: "#444444",
	headingColor: "#555555",
	backgroundColor: "#666666",
};

test("rejects requests with no auth cookie", async () => {
	const res = await request(buildApp()).put("/api/admin/settings").send(VALID_BODY);
	assert.equal(res.status, 401);
});

test("updates and persists all six color fields", async t => {
	t.after(async () => {
		await prisma.siteSettings.deleteMany();
	});

	const res = await request(buildApp())
		.put("/api/admin/settings")
		.set("Cookie", authCookie())
		.send(VALID_BODY);

	assert.equal(res.status, 200);
	assert.equal(res.body.settings.primaryColor, "#111111");
	assert.equal(res.body.settings.hoverColor, "#333333");
	assert.equal(res.body.settings.backgroundColor, "#666666");
});

test("rejects an invalid hex value and saves nothing", async t => {
	t.after(async () => {
		await prisma.siteSettings.deleteMany();
	});

	const res = await request(buildApp())
		.put("/api/admin/settings")
		.set("Cookie", authCookie())
		.send({ ...VALID_BODY, primaryColor: "not-a-color" });

	assert.equal(res.status, 400);
	const stored = await prisma.siteSettings.findUnique({ where: { id: 1 } });
	assert.equal(stored, null);
});
