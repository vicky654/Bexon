const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");

const testDbPath = path.join(__dirname, "../../data/test-admin-jobs.db");
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
const adminJobsRouter = require("./adminJobs");
const { signAdminToken, COOKIE_NAME } = require("../lib/auth");

function buildApp() {
	const app = express();
	app.use(express.json());
	app.use(cookieParser());
	app.use("/api/admin/jobs", adminJobsRouter);
	return app;
}

function authCookie() {
	const token = signAdminToken({ id: 1, email: "admin@example.com" });
	return `${COOKIE_NAME}=${token}`;
}

test("rejects requests with no auth cookie", async () => {
	const res = await request(buildApp()).get("/api/admin/jobs");
	assert.equal(res.status, 401);
});

test("lists both published and unpublished jobs", async t => {
	t.after(async () => {
		await prisma.job.deleteMany();
	});

	await prisma.job.create({ data: { title: "Published role", published: true } });
	await prisma.job.create({ data: { title: "Draft role", published: false } });

	const res = await request(buildApp()).get("/api/admin/jobs").set("Cookie", authCookie());
	assert.equal(res.status, 200);
	assert.equal(res.body.jobs.length, 2);
});

test("rejects creation without a title", async () => {
	const res = await request(buildApp())
		.post("/api/admin/jobs")
		.set("Cookie", authCookie())
		.send({ department: "Legal" });

	assert.equal(res.status, 400);
});

test("creates a job with defaults", async t => {
	t.after(async () => {
		await prisma.job.deleteMany();
	});

	const res = await request(buildApp())
		.post("/api/admin/jobs")
		.set("Cookie", authCookie())
		.send({ title: "Privacy Consultant" });

	assert.equal(res.status, 201);
	assert.equal(res.body.job.title, "Privacy Consultant");
	assert.equal(res.body.job.published, true);
});

test("updates a job", async t => {
	t.after(async () => {
		await prisma.job.deleteMany();
	});

	const job = await prisma.job.create({ data: { title: "Old title" } });

	const res = await request(buildApp())
		.put(`/api/admin/jobs/${job.id}`)
		.set("Cookie", authCookie())
		.send({ title: "New title", published: false });

	assert.equal(res.status, 200);
	assert.equal(res.body.job.title, "New title");
	assert.equal(res.body.job.published, false);
});

test("deletes a job", async () => {
	const job = await prisma.job.create({ data: { title: "To delete" } });

	const res = await request(buildApp())
		.delete(`/api/admin/jobs/${job.id}`)
		.set("Cookie", authCookie());

	assert.equal(res.status, 200);
	const stored = await prisma.job.findUnique({ where: { id: job.id } });
	assert.equal(stored, null);
});
