const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");

const testDbPath = path.join(__dirname, "../../data/test-settings.db");
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
const request = require("supertest");
const prisma = require("../lib/prisma");
const settingsRouter = require("./settings");

function buildApp() {
	const app = express();
	app.use(express.json());
	app.use("/api/settings", settingsRouter);
	return app;
}

test("GET creates and returns the default settings row on first call", async t => {
	t.after(async () => {
		await prisma.siteSettings.deleteMany();
	});

	const res = await request(buildApp()).get("/api/settings");
	assert.equal(res.status, 200);
	assert.equal(res.body.settings.id, 1);
	assert.equal(res.body.settings.primaryColor, "#02092c");
	assert.equal(res.body.settings.hoverColor, "#02092c");
});

test("GET returns the persisted row on subsequent calls, not a fresh default", async t => {
	t.after(async () => {
		await prisma.siteSettings.deleteMany();
	});

	const app = buildApp();
	await request(app).get("/api/settings");
	await prisma.siteSettings.update({
		where: { id: 1 },
		data: { primaryColor: "#123456" },
	});

	const res = await request(app).get("/api/settings");
	assert.equal(res.body.settings.primaryColor, "#123456");
});
