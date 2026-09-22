const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");

const testDbPath = path.join(__dirname, "../../data/test-admin-job-applications.db");
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
const adminJobApplicationsRouter = require("./adminJobApplications");
const { signAdminToken, COOKIE_NAME } = require("../lib/auth");

function buildApp() {
	const app = express();
	app.use(express.json());
	app.use(cookieParser());
	app.use("/api/admin/job-applications", adminJobApplicationsRouter);
	return app;
}

function authCookie() {
	const token = signAdminToken({ id: 1, email: "admin@example.com" });
	return `${COOKIE_NAME}=${token}`;
}

async function createJobAndApplication() {
	const job = await prisma.job.create({ data: { title: "Consultant" } });
	const application = await prisma.jobApplication.create({
		data: { jobId: job.id, name: "Jane Doe", email: "jane@example.com" },
	});
	return { job, application };
}

test("rejects requests with no auth cookie", async () => {
	const res = await request(buildApp()).get("/api/admin/job-applications");
	assert.equal(res.status, 401);
});

test("lists applications with the related job title", async t => {
	t.after(async () => {
		await prisma.jobApplication.deleteMany();
		await prisma.job.deleteMany();
	});

	await createJobAndApplication();

	const res = await request(buildApp())
		.get("/api/admin/job-applications")
		.set("Cookie", authCookie());

	assert.equal(res.status, 200);
	assert.equal(res.body.applications.length, 1);
	assert.equal(res.body.applications[0].job.title, "Consultant");
});

test("updates status to a valid value", async t => {
	t.after(async () => {
		await prisma.jobApplication.deleteMany();
		await prisma.job.deleteMany();
	});

	const { application } = await createJobAndApplication();

	const res = await request(buildApp())
		.put(`/api/admin/job-applications/${application.id}`)
		.set("Cookie", authCookie())
		.send({ status: "shortlisted" });

	assert.equal(res.status, 200);
	assert.equal(res.body.application.status, "shortlisted");
});

test("rejects an invalid status", async t => {
	t.after(async () => {
		await prisma.jobApplication.deleteMany();
		await prisma.job.deleteMany();
	});

	const { application } = await createJobAndApplication();

	const res = await request(buildApp())
		.put(`/api/admin/job-applications/${application.id}`)
		.set("Cookie", authCookie())
		.send({ status: "not-a-real-status" });

	assert.equal(res.status, 400);
});

test("deletes an application", async () => {
	const { application } = await createJobAndApplication();

	const res = await request(buildApp())
		.delete(`/api/admin/job-applications/${application.id}`)
		.set("Cookie", authCookie());

	assert.equal(res.status, 200);
	const stored = await prisma.jobApplication.findUnique({ where: { id: application.id } });
	assert.equal(stored, null);
});
