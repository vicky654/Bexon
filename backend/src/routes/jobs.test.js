const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");

const testDbPath = path.join(__dirname, "../../data/test-jobs.db");
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
const jobsRouter = require("./jobs");

function buildApp() {
	const app = express();
	app.use(express.json());
	app.use("/api/jobs", jobsRouter);
	return app;
}

test("GET / only returns published jobs", async t => {
	t.after(async () => {
		await prisma.job.deleteMany();
	});

	await prisma.job.create({ data: { title: "Published role", published: true } });
	await prisma.job.create({ data: { title: "Draft role", published: false } });

	const res = await request(buildApp()).get("/api/jobs");
	assert.equal(res.status, 200);
	assert.equal(res.body.jobs.length, 1);
	assert.equal(res.body.jobs[0].title, "Published role");
});

test("GET /:id 404s for an unpublished job", async t => {
	t.after(async () => {
		await prisma.job.deleteMany();
	});

	const job = await prisma.job.create({ data: { title: "Draft role", published: false } });

	const res = await request(buildApp()).get(`/api/jobs/${job.id}`);
	assert.equal(res.status, 404);
});

test("POST /:id/apply requires name and email", async t => {
	t.after(async () => {
		await prisma.job.deleteMany();
		await prisma.jobApplication.deleteMany();
	});

	const job = await prisma.job.create({ data: { title: "Consultant", published: true } });

	const res = await request(buildApp())
		.post(`/api/jobs/${job.id}/apply`)
		.field("phone", "1234567890");

	assert.equal(res.status, 400);
});

test("POST /:id/apply rejects an invalid email", async t => {
	t.after(async () => {
		await prisma.job.deleteMany();
		await prisma.jobApplication.deleteMany();
	});

	const job = await prisma.job.create({ data: { title: "Consultant", published: true } });

	const res = await request(buildApp())
		.post(`/api/jobs/${job.id}/apply`)
		.field("name", "Jane Doe")
		.field("email", "not-an-email");

	assert.equal(res.status, 400);
});

test("POST /:id/apply creates an application for a valid submission", async t => {
	t.after(async () => {
		await prisma.job.deleteMany();
		await prisma.jobApplication.deleteMany();
	});

	const job = await prisma.job.create({ data: { title: "Consultant", published: true } });

	const res = await request(buildApp())
		.post(`/api/jobs/${job.id}/apply`)
		.field("name", "Jane Doe")
		.field("email", "jane@example.com")
		.field("coverLetter", "I would love to join.");

	assert.equal(res.status, 201);
	const stored = await prisma.jobApplication.findFirst({ where: { jobId: job.id } });
	assert.equal(stored.name, "Jane Doe");
	assert.equal(stored.email, "jane@example.com");
});

test("POST /:id/apply 404s for an unpublished job", async t => {
	t.after(async () => {
		await prisma.job.deleteMany();
		await prisma.jobApplication.deleteMany();
	});

	const job = await prisma.job.create({ data: { title: "Draft role", published: false } });

	const res = await request(buildApp())
		.post(`/api/jobs/${job.id}/apply`)
		.field("name", "Jane Doe")
		.field("email", "jane@example.com");

	assert.equal(res.status, 404);
});
