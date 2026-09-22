const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");

const testDbPath = path.join(__dirname, "../../data/test-admin-brand-logos.db");
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
const adminBrandLogosRouter = require("./adminBrandLogos");
const { signAdminToken, COOKIE_NAME } = require("../lib/auth");

function buildApp() {
	const app = express();
	app.use(express.json());
	app.use(cookieParser());
	app.use("/api/admin/brand-logos", adminBrandLogosRouter);
	return app;
}

function authCookie() {
	const token = signAdminToken({ id: 1, email: "admin@example.com" });
	return `${COOKIE_NAME}=${token}`;
}

test("rejects requests with no auth cookie", async () => {
	const res = await request(buildApp()).get("/api/admin/brand-logos");
	assert.equal(res.status, 401);
});

test("creates logos with increasing sortOrder", async t => {
	t.after(async () => {
		await prisma.brandLogo.deleteMany();
	});

	const first = await request(buildApp())
		.post("/api/admin/brand-logos")
		.set("Cookie", authCookie())
		.send({ imageUrl: "/uploads/a.png", alt: "Alpha" });
	const second = await request(buildApp())
		.post("/api/admin/brand-logos")
		.set("Cookie", authCookie())
		.send({ imageUrl: "/uploads/b.png", alt: "Beta" });

	assert.equal(first.status, 201);
	assert.equal(first.body.logo.sortOrder, 0);
	assert.equal(second.status, 201);
	assert.equal(second.body.logo.sortOrder, 1);
});

test("rejects creation without an imageUrl", async () => {
	const res = await request(buildApp())
		.post("/api/admin/brand-logos")
		.set("Cookie", authCookie())
		.send({ alt: "No image" });

	assert.equal(res.status, 400);
});

test("reorders logos by the given id order", async t => {
	t.after(async () => {
		await prisma.brandLogo.deleteMany();
	});

	const a = await prisma.brandLogo.create({ data: { imageUrl: "/uploads/a.png", sortOrder: 0 } });
	const b = await prisma.brandLogo.create({ data: { imageUrl: "/uploads/b.png", sortOrder: 1 } });
	const c = await prisma.brandLogo.create({ data: { imageUrl: "/uploads/c.png", sortOrder: 2 } });

	const res = await request(buildApp())
		.put("/api/admin/brand-logos/reorder")
		.set("Cookie", authCookie())
		.send({ ids: [c.id, a.id, b.id] });

	assert.equal(res.status, 200);
	assert.deepEqual(
		res.body.logos.map(l => l.id),
		[c.id, a.id, b.id]
	);
});

test("deletes a logo", async t => {
	const logo = await prisma.brandLogo.create({ data: { imageUrl: "/uploads/a.png" } });

	const res = await request(buildApp())
		.delete(`/api/admin/brand-logos/${logo.id}`)
		.set("Cookie", authCookie());

	assert.equal(res.status, 200);
	const stored = await prisma.brandLogo.findUnique({ where: { id: logo.id } });
	assert.equal(stored, null);
});
