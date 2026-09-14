const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");

const testDbPath = path.join(__dirname, "../../data/test-contact.db");
process.env.DATABASE_URL = `file:${testDbPath}`;
delete process.env.SMTP_HOST;
delete process.env.SMTP_USER;

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
const contactRouter = require("./contact");

function buildApp() {
	const app = express();
	app.use(express.json());
	app.use("/api/contact", contactRouter);
	return app;
}

test("saves a submission and succeeds even with no SMTP configured", async () => {
	const res = await request(buildApp()).post("/api/contact").send({
		name: "Test User",
		email: "test@example.com",
		message: "Hello there",
	});

	assert.equal(res.status, 201);

	const saved = await prisma.contactSubmission.findUnique({
		where: { id: res.body.id },
	});
	assert.equal(saved.name, "Test User");
	assert.equal(saved.status, "new");
});

test("still returns 201 and saves the submission when SMTP is configured but sending fails", async () => {
	process.env.SMTP_HOST = "smtp.example.com";
	process.env.SMTP_USER = "sender@example.com";

	const nodemailer = require("nodemailer");
	const originalCreateTransport = nodemailer.createTransport;
	nodemailer.createTransport = () => ({
		sendMail: async () => {
			throw new Error("SMTP send failed");
		},
	});

	try {
		const res = await request(buildApp()).post("/api/contact").send({
			name: "Test User Two",
			email: "test2@example.com",
			message: "This send should fail but the request should still succeed",
		});

		assert.equal(res.status, 201);

		const saved = await prisma.contactSubmission.findUnique({
			where: { id: res.body.id },
		});
		assert.equal(saved.name, "Test User Two");
		assert.equal(saved.status, "new");
	} finally {
		nodemailer.createTransport = originalCreateTransport;
		delete process.env.SMTP_HOST;
		delete process.env.SMTP_USER;
	}
});

test("rejects a missing message", async () => {
	const res = await request(buildApp())
		.post("/api/contact")
		.send({ name: "Test User", email: "test@example.com" });
	assert.equal(res.status, 400);
});

test("rejects an invalid email", async () => {
	const res = await request(buildApp())
		.post("/api/contact")
		.send({ name: "Test User", email: "not-an-email", message: "Hi" });
	assert.equal(res.status, 400);
});
