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

test("filters messages by type and returns per-type counts", async t => {
	await prisma.contactSubmission.createMany({
		data: [
			{ name: "A", email: "a@example.com", message: "m", type: "contact" },
			{ name: "B", email: "b@example.com", message: "", type: "newsletter" },
			{ name: "C", email: "c@example.com", message: "", type: "newsletter" },
		],
	});
	t.after(async () => {
		await prisma.contactSubmission.deleteMany();
	});

	const all = await request(buildApp()).get("/api/admin/messages").set("Cookie", authCookie());
	assert.equal(all.body.messages.length, 3);
	assert.deepEqual(all.body.counts, { all: 3, contact: 1, consultation: 0, partner: 0, newsletter: 2 });

	const news = await request(buildApp()).get("/api/admin/messages?type=newsletter").set("Cookie", authCookie());
	assert.equal(news.body.messages.length, 2);

	const bogus = await request(buildApp()).get("/api/admin/messages?type=bogus").set("Cookie", authCookie());
	assert.equal(bogus.body.messages.length, 3);
});

test("exports CSV with escaping and formula protection", async t => {
	await prisma.contactSubmission.create({
		data: {
			name: 'Doe, "JD"',
			email: "jd@example.com",
			phone: "9876543210",
			message: "=HYPERLINK(\"http://evil\")\nline two",
			type: "partner",
			company: "Acme",
			partnershipType: "reseller",
			service: "Reseller / Referral",
			consentRecorded: true,
		},
	});
	t.after(async () => {
		await prisma.contactSubmission.deleteMany();
	});

	const res = await request(buildApp()).get("/api/admin/messages/export.csv?type=partner").set("Cookie", authCookie());
	assert.equal(res.status, 200);
	assert.match(res.headers["content-type"], /text\/csv/);
	assert.match(res.headers["content-disposition"], /attachment; filename="dpdp-leads-partner-\d{4}-\d{2}-\d{2}\.csv"/);

	const body = res.text.replace(/^﻿/, "");
	const [header] = body.split("\r\n");
	assert.equal(
		header,
		"Received,Type,Name,Email,Phone,Company,Purpose,Partnership type,Preferred time,Message,Consent recorded,Language,UTM,Referrer"
	);
	assert.ok(body.includes('"Doe, ""JD"""'));
	assert.ok(body.includes("\"'=HYPERLINK(\"\"http://evil\"\")\nline two\""));
	assert.ok(body.includes(",Partner,"));
	assert.ok(body.includes(",Reseller / Referral,"));
	assert.ok(body.includes(",Yes,"));
});

test("exports Received and Preferred time in IST", async t => {
	await prisma.contactSubmission.create({
		data: {
			name: "Ravi Kumar",
			email: "ravi@example.com",
			phone: "9876543210",
			message: "",
			type: "consultation",
			createdAt: new Date("2026-10-05T04:30:00.000Z"),
			preferredAt: new Date("2026-10-05T04:30:00.000Z"),
		},
	});
	t.after(async () => {
		await prisma.contactSubmission.deleteMany();
	});

	const res = await request(buildApp())
		.get("/api/admin/messages/export.csv?type=consultation")
		.set("Cookie", authCookie());
	assert.equal(res.status, 200);

	const body = res.text.replace(/^﻿/, "");
	const [, row] = body.split("\r\n");
	const cells = row.split(",");
	assert.equal(cells[0], "2026-10-05 10:00 IST");
	assert.equal(cells[8], "2026-10-05 10:00 IST");
});

test("Preferred time is empty when absent", async t => {
	await prisma.contactSubmission.create({
		data: { name: "No Time", email: "notime@example.com", message: "" },
	});
	t.after(async () => {
		await prisma.contactSubmission.deleteMany();
	});

	const res = await request(buildApp()).get("/api/admin/messages/export.csv").set("Cookie", authCookie());
	const body = res.text.replace(/^﻿/, "");
	const [, row] = body.split("\r\n");
	assert.equal(row.split(",")[8], "");
});

test("export requires admin auth", async () => {
	const res = await request(buildApp()).get("/api/admin/messages/export.csv");
	assert.equal(res.status, 401);
});
