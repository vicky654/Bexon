const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");

const testDbPath = path.join(__dirname, "../../data/test-brand-logos.db");
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
const brandLogosRouter = require("./brandLogos");

function buildApp() {
	const app = express();
	app.use(express.json());
	app.use("/api/brand-logos", brandLogosRouter);
	return app;
}

test("GET returns an empty list when no logos exist", async () => {
	const res = await request(buildApp()).get("/api/brand-logos");
	assert.equal(res.status, 200);
	assert.deepEqual(res.body.logos, []);
});

test("GET returns logos ordered by sortOrder", async t => {
	t.after(async () => {
		await prisma.brandLogo.deleteMany();
	});

	await prisma.brandLogo.create({ data: { imageUrl: "/uploads/b.png", sortOrder: 1 } });
	await prisma.brandLogo.create({ data: { imageUrl: "/uploads/a.png", sortOrder: 0 } });

	const res = await request(buildApp()).get("/api/brand-logos");
	assert.equal(res.status, 200);
	assert.deepEqual(
		res.body.logos.map(l => l.imageUrl),
		["/uploads/a.png", "/uploads/b.png"]
	);
});
