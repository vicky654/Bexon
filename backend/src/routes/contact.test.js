const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");

const testDbPath = path.join(__dirname, "../../data/test-contact.db");
process.env.DATABASE_URL = `file:${testDbPath}`;

// These tests exercise the "portal/reCAPTCHA not configured" paths and stub
// consentPortal/recaptcha directly, so real values left in backend/.env (a
// dev convenience) must not leak in and produce a live-configured backend.
const REAL_ENV_VARS_TO_CLEAR = [
	"RECAPTCHA_SITE_KEY",
	"RECAPTCHA_SECRET",
	"CONSENT_API_BASE",
	"CONSENT_JWT_SECRET",
	"CONSENT_JWT_ISS",
	"CONSENT_JWT_AUD",
	"CONSENT_JWT_EMAIL",
	"CONSENT_DEPARTMENT",
	"TRUST_PROXY",
	"SMTP_HOST",
	"SMTP_USER",
	"SMTP_PASS",
	"CONTACT_TO_EMAIL",
	"CONTACT_FROM_EMAIL",
];
for (const name of REAL_ENV_VARS_TO_CLEAR) delete process.env[name];

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
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");

// Requiring the Prisma client can itself load backend/.env (dotenv doesn't
// overwrite vars that are already set, but ours were just deleted above), so
// clear them again here in case that happened.
for (const name of REAL_ENV_VARS_TO_CLEAR) delete process.env[name];

const consentPortal = require("../lib/consentPortal");
const recaptcha = require("../lib/recaptcha");
const contactRouter = require("./contact");

const original = {
	isConfigured: consentPortal.isConfigured,
	getConsentNotices: consentPortal.getConsentNotices,
	createConsent: consentPortal.createConsent,
	verifyRecaptcha: recaptcha.verifyRecaptcha,
};

let portalCalls;
let nextIp = 1;

function buildApp() {
	const app = express();
	app.set("trust proxy", "loopback");
	app.use(express.json());
	app.use("/api/contact", contactRouter);
	return app;
}

// Each test uses its own client IP so the per-IP start limiter doesn't
// leak between tests.
function freshIp() {
	nextIp += 1;
	return `10.0.0.${nextIp}`;
}

// Each test that doesn't specifically care about the shared "jane@example.com"
// address uses its own email so the per-email start limiter doesn't leak
// between tests.
let nextEmailSeq = 1;
function freshEmail() {
	nextEmailSeq += 1;
	return `lead${nextEmailSeq}@example.com`;
}

function portalOn({ otp = "123456", failOn } = {}) {
	portalCalls = [];
	consentPortal.isConfigured = () => true;
	consentPortal.createConsent = async args => {
		portalCalls.push(args);
		if (failOn === "start" && !args.otp) throw new Error("portal down");
		if (failOn === "record" && args.otp) throw new Error("portal down");
		return args.otp ? { status: "Success" } : { otp };
	};
	recaptcha.verifyRecaptcha = async () => true;
}

function restore() {
	Object.assign(consentPortal, {
		isConfigured: original.isConfigured,
		getConsentNotices: original.getConsentNotices,
		createConsent: original.createConsent,
	});
	recaptcha.verifyRecaptcha = original.verifyRecaptcha;
}

const validLead = {
	name: "Jane Doe",
	email: "jane@example.com",
	phone: "9876543210",
	topic: "dpo_service",
	message: "We need a DPO.",
	tracking: { utm: "utm_source=linkedin", referrer: "https://www.linkedin.com/" },
};

async function start(app, ip, body = validLead) {
	return request(app).post("/api/contact/start").set("X-Forwarded-For", ip).send(body);
}

test.afterEach(restore);

test("config reports verification off when the portal is not configured", async () => {
	consentPortal.isConfigured = () => false;
	const res = await request(buildApp()).get("/api/contact/config");
	assert.equal(res.status, 200);
	assert.deepEqual(res.body, { verification: false, recaptchaSiteKey: "", notices: {} });
});

test("config returns portal notices and the site key", async () => {
	consentPortal.isConfigured = () => true;
	consentPortal.getConsentNotices = async () => ({ English: "<p>Notice</p>" });
	process.env.RECAPTCHA_SITE_KEY = "site-key";
	try {
		const res = await request(buildApp()).get("/api/contact/config");
		assert.deepEqual(res.body, {
			verification: true,
			recaptchaSiteKey: "site-key",
			notices: { English: "<p>Notice</p>" },
		});
	} finally {
		delete process.env.RECAPTCHA_SITE_KEY;
	}
});

test("config still answers when the notice fetch fails", async () => {
	consentPortal.isConfigured = () => true;
	consentPortal.getConsentNotices = async () => {
		throw new Error("portal down");
	};
	const res = await request(buildApp()).get("/api/contact/config");
	assert.equal(res.status, 200);
	assert.deepEqual(res.body.notices, {});
});

test("start saves directly when verification is off", async () => {
	consentPortal.isConfigured = () => false;
	const res = await start(buildApp(), freshIp(), { ...validLead, email: "direct@example.com" });
	assert.equal(res.status, 201);
	assert.deepEqual(res.body, { done: true });

	const saved = await prisma.contactSubmission.findFirst({ where: { email: "direct@example.com" } });
	assert.equal(saved.topic, "Data Protection Officer as a Service");
	assert.equal(saved.service, "Data Protection Officer as a Service");
	assert.equal(saved.utm, "utm_source=linkedin");
	assert.equal(saved.consentRecorded, false);
});

test("start rejects invalid input with 400", async () => {
	portalOn();
	const app = buildApp();
	const cases = [
		{ ...validLead, message: "" },
		{ ...validLead, email: "not-an-email" },
		{ ...validLead, phone: "98765" },
		{ ...validLead, topic: "business_strategy" },
		{ ...validLead, name: 123 },
		{ ...validLead, tracking: "x", phone: "12" },
		{ ...validLead, name: "a".repeat(101) },
		{ ...validLead, email: `${"a".repeat(250)}@example.com` },
		{ ...validLead, message: "a".repeat(5001) },
	];
	for (const body of cases) {
		const res = await start(app, freshIp(), body);
		assert.equal(res.status, 400, JSON.stringify(body));
		assert.ok(res.body.message);
	}
	const empty = await request(app).post("/api/contact/start").set("X-Forwarded-For", freshIp());
	assert.equal(empty.status, 400);
	assert.equal(portalCalls.length, 0);
});

test("start asks the portal for a code and stores only its hash", async () => {
	portalOn();
	const ip = freshIp();
	const res = await start(buildApp(), ip, { ...validLead, email: "  Jane@Example.COM " });

	assert.equal(res.status, 201);
	assert.ok(res.body.verificationId);
	assert.equal(JSON.stringify(res.body).includes("123456"), false);

	assert.equal(portalCalls.length, 1);
	assert.equal(portalCalls[0].otp, undefined);
	assert.equal(portalCalls[0].email, "jane@example.com");
	assert.equal(portalCalls[0].department, "Contact Us");
	assert.equal(portalCalls[0].ipaddress, ip);
	assert.equal(portalCalls[0].language, "English");

	const row = await prisma.contactVerification.findUnique({ where: { id: res.body.verificationId } });
	assert.equal(row.email, "jane@example.com");
	assert.notEqual(row.otpHash, "123456");
	assert.equal(await bcrypt.compare("123456", row.otpHash), true);
});

test("start returns 502 and stores nothing when the portal is down", async () => {
	portalOn({ failOn: "start" });
	const before = await prisma.contactVerification.count();
	const res = await start(buildApp(), freshIp(), { ...validLead, email: freshEmail() });
	assert.equal(res.status, 502);
	assert.match(res.body.message, /info@dpdpconsultants\.com/);
	assert.equal(await prisma.contactVerification.count(), before);
});

test("start returns 502 when the portal response has no otp", async () => {
	portalOn({ otp: "" });
	const res = await start(buildApp(), freshIp(), { ...validLead, email: freshEmail() });
	assert.equal(res.status, 502);
});

test("start is limited to 5 requests per IP", async () => {
	portalOn();
	const app = buildApp();
	const ip = freshIp();
	const email = freshEmail();
	for (let i = 0; i < 5; i += 1) {
		assert.equal((await start(app, ip, { ...validLead, email })).status, 201);
	}
	assert.equal((await start(app, ip, { ...validLead, email })).status, 429);
});

test("start is limited to 5 requests per email across different IPs", async () => {
	portalOn();
	const app = buildApp();
	const email = freshEmail();
	for (let i = 0; i < 5; i += 1) {
		assert.equal((await start(app, freshIp(), { ...validLead, email })).status, 201);
	}
	assert.equal((await start(app, freshIp(), { ...validLead, email })).status, 429);
});

test("verify with the right code records consent and saves the lead", async () => {
	portalOn();
	const app = buildApp();
	const email = "verified@example.com";
	const { body } = await start(app, freshIp(), { ...validLead, email });

	const res = await request(app)
		.post("/api/contact/verify")
		.send({ verificationId: body.verificationId, otp: "123456", language: "Hindi", recaptchaToken: "tok" });

	assert.equal(res.status, 200);
	assert.deepEqual(res.body, { done: true });
	assert.equal(portalCalls[1].otp, "123456");
	assert.equal(portalCalls[1].language, "Hindi");

	const saved = await prisma.contactSubmission.findFirst({ where: { email } });
	assert.equal(saved.consentRecorded, true);
	assert.equal(saved.language, "Hindi");
	assert.equal(saved.device, "Desktop");
	assert.equal(await prisma.contactVerification.findUnique({ where: { id: body.verificationId } }), null);
});

test("verify accepts a code the portal returned as a number", async () => {
	portalOn({ otp: 123456 });
	const app = buildApp();
	const { body } = await start(app, freshIp(), { ...validLead, email: "numeric@example.com" });
	const res = await request(app)
		.post("/api/contact/verify")
		.send({ verificationId: body.verificationId, otp: "123456", recaptchaToken: "tok" });
	assert.equal(res.status, 200);
});

test("verify rejects a wrong code and counts the attempt", async () => {
	portalOn();
	const app = buildApp();
	const { body } = await start(app, freshIp(), { ...validLead, email: freshEmail() });
	const res = await request(app)
		.post("/api/contact/verify")
		.send({ verificationId: body.verificationId, otp: "000000", recaptchaToken: "tok" });

	assert.equal(res.status, 400);
	assert.deepEqual(res.body, { message: "Invalid OTP", field: "otp" });
	const row = await prisma.contactVerification.findUnique({ where: { id: body.verificationId } });
	assert.equal(row.attempts, 1);
});

test("the fifth wrong code ends the verification", async () => {
	portalOn();
	const app = buildApp();
	const { body } = await start(app, freshIp(), { ...validLead, email: freshEmail() });
	const statuses = [];
	for (let i = 0; i < 5; i += 1) {
		const res = await request(app)
			.post("/api/contact/verify")
			.send({ verificationId: body.verificationId, otp: "000000", recaptchaToken: "tok" });
		statuses.push(res.status);
	}
	assert.deepEqual(statuses, [400, 400, 400, 400, 429]);
	assert.equal(await prisma.contactVerification.findUnique({ where: { id: body.verificationId } }), null);
});

test("eight simultaneous wrong codes never exceed the attempt cap", async () => {
	portalOn();
	const app = buildApp();
	const { body } = await start(app, freshIp(), { ...validLead, email: freshEmail() });
	const send = () =>
		request(app)
			.post("/api/contact/verify")
			.send({ verificationId: body.verificationId, otp: "000000", recaptchaToken: "tok" });

	const statuses = (await Promise.all(Array.from({ length: 8 }, send))).map(res => res.status);
	const wins = statuses.filter(status => status === 400).length;
	assert.ok(wins <= 5, `expected at most 5 successful guesses, got statuses ${JSON.stringify(statuses)}`);
	assert.ok(
		statuses.every(status => [400, 429, 410].includes(status)),
		`expected only 400/429/410, got statuses ${JSON.stringify(statuses)}`
	);
	assert.equal(await prisma.contactVerification.findUnique({ where: { id: body.verificationId } }), null);
});

test("verify returns 410 for an expired or unknown verification", async () => {
	portalOn();
	const app = buildApp();
	const { body } = await start(app, freshIp(), { ...validLead, email: freshEmail() });
	await prisma.contactVerification.update({
		where: { id: body.verificationId },
		data: { expiresAt: new Date(Date.now() - 1000) },
	});

	const expired = await request(app)
		.post("/api/contact/verify")
		.send({ verificationId: body.verificationId, otp: "123456", recaptchaToken: "tok" });
	assert.equal(expired.status, 410);

	const unknown = await request(app)
		.post("/api/contact/verify")
		.send({ verificationId: "does-not-exist", otp: "123456", recaptchaToken: "tok" });
	assert.equal(unknown.status, 410);
});

test("verify rejects a failed reCAPTCHA without counting an attempt", async () => {
	portalOn();
	recaptcha.verifyRecaptcha = async () => false;
	const app = buildApp();
	const { body } = await start(app, freshIp(), { ...validLead, email: freshEmail() });
	const res = await request(app)
		.post("/api/contact/verify")
		.send({ verificationId: body.verificationId, otp: "123456", recaptchaToken: "" });

	assert.equal(res.status, 400);
	assert.equal(res.body.field, "recaptcha");
	const row = await prisma.contactVerification.findUnique({ where: { id: body.verificationId } });
	assert.equal(row.attempts, 0);
});

test("the lead is still saved when recording consent fails", async () => {
	portalOn({ failOn: "record" });
	const app = buildApp();
	const email = "consentfail@example.com";
	const { body } = await start(app, freshIp(), { ...validLead, email });
	const res = await request(app)
		.post("/api/contact/verify")
		.send({ verificationId: body.verificationId, otp: "123456", recaptchaToken: "tok" });

	assert.equal(res.status, 200);
	const saved = await prisma.contactSubmission.findFirst({ where: { email } });
	assert.equal(saved.consentRecorded, false);
});

test("two simultaneous verifies save the lead only once", async () => {
	portalOn();
	const app = buildApp();
	const email = "doubleclick@example.com";
	const { body } = await start(app, freshIp(), { ...validLead, email });
	const send = () =>
		request(app)
			.post("/api/contact/verify")
			.send({ verificationId: body.verificationId, otp: "123456", recaptchaToken: "tok" });

	const statuses = (await Promise.all([send(), send()])).map(res => res.status).sort();
	assert.deepEqual(statuses, [200, 410]);
	assert.equal(await prisma.contactSubmission.count({ where: { email } }), 1);
});

test("test addresses complete the flow without being saved", async () => {
	portalOn();
	const app = buildApp();
	const email = "tester@yopmail.com";
	const { body } = await start(app, freshIp(), { ...validLead, email });
	const res = await request(app)
		.post("/api/contact/verify")
		.send({ verificationId: body.verificationId, otp: "123456", recaptchaToken: "tok" });

	assert.equal(res.status, 200);
	assert.equal(await prisma.contactSubmission.count({ where: { email } }), 0);
});

test("resend waits 30 seconds, then sends a fresh code", async () => {
	portalOn({ otp: "111111" });
	const app = buildApp();
	const { body } = await start(app, freshIp(), { ...validLead, email: freshEmail() });

	const tooSoon = await request(app).post("/api/contact/resend").send({ verificationId: body.verificationId });
	assert.equal(tooSoon.status, 429);

	await prisma.contactVerification.update({
		where: { id: body.verificationId },
		data: { lastSentAt: new Date(Date.now() - 31 * 1000), attempts: 3 },
	});
	portalOn({ otp: "222222" });
	const res = await request(app).post("/api/contact/resend").send({ verificationId: body.verificationId });
	assert.equal(res.status, 200);

	const row = await prisma.contactVerification.findUnique({ where: { id: body.verificationId } });
	assert.equal(row.attempts, 0);
	assert.equal(await bcrypt.compare("222222", row.otpHash), true);
});

test("the lead is saved even when the notification email fails", async () => {
	consentPortal.isConfigured = () => false;
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
		const email = "smtpfail@example.com";
		const res = await start(buildApp(), freshIp(), { ...validLead, email });
		assert.equal(res.status, 201);
		assert.equal(await prisma.contactSubmission.count({ where: { email } }), 1);
	} finally {
		nodemailer.createTransport = originalCreateTransport;
		delete process.env.SMTP_HOST;
		delete process.env.SMTP_USER;
	}
});

const futureIso = days => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

const consultationLead = () => ({
	type: "consultation",
	name: "Ravi Kumar",
	email: freshEmail(),
	phone: "9123456780",
	company: "Acme Pvt Ltd",
	topic: "gap_assessment",
	preferredAt: futureIso(3),
	message: "",
});

test("unknown lead type is rejected", async () => {
	portalOn();
	const res = await start(buildApp(), freshIp(), { ...validLead, email: freshEmail(), type: "poem" });
	assert.equal(res.status, 400);
	assert.equal(res.body.message, "Unknown form type.");
	assert.equal(portalCalls.length, 0);
});

test("consultation asks the portal for a Sales Enquiry code and saves its fields", async () => {
	portalOn();
	const app = buildApp();
	const lead = consultationLead();
	const { body } = await start(app, freshIp(), lead);
	assert.ok(body.verificationId);
	assert.equal(portalCalls[0].department, "Sales Enquiry");

	const res = await request(app)
		.post("/api/contact/verify")
		.send({ verificationId: body.verificationId, otp: "123456", recaptchaToken: "tok" });
	assert.equal(res.status, 200);
	assert.equal(portalCalls[1].department, "Sales Enquiry");

	const saved = await prisma.contactSubmission.findFirst({ where: { email: lead.email } });
	assert.equal(saved.type, "consultation");
	assert.equal(saved.company, "Acme Pvt Ltd");
	assert.equal(saved.topic, "Gap Assessment Review & Remediation Planning");
	assert.equal(saved.preferredAt.toISOString(), lead.preferredAt);
});

test("consultation without a preferred time is accepted", async () => {
	consentPortal.isConfigured = () => false;
	const lead = { ...consultationLead(), preferredAt: "" };
	const res = await start(buildApp(), freshIp(), lead);
	assert.equal(res.status, 201);
	const saved = await prisma.contactSubmission.findFirst({ where: { email: lead.email } });
	assert.equal(saved.preferredAt, null);
});

test("consultation time outside the window is rejected", async () => {
	portalOn();
	const res = await start(buildApp(), freshIp(), { ...consultationLead(), preferredAt: futureIso(40) });
	assert.equal(res.status, 400);
	assert.equal(res.body.message, "Please choose a time at least 24 hours from now and within one month.");
});

test("resend uses the verification's stored department for consultation leads", async () => {
	portalOn();
	const app = buildApp();
	const lead = consultationLead();
	const { body } = await start(app, freshIp(), lead);
	assert.equal(portalCalls[0].department, "Sales Enquiry");

	await prisma.contactVerification.update({
		where: { id: body.verificationId },
		data: { lastSentAt: new Date(Date.now() - 31 * 1000) },
	});

	const res = await request(app).post("/api/contact/resend").send({ verificationId: body.verificationId });
	assert.equal(res.status, 200);
	assert.equal(portalCalls[1].department, "Sales Enquiry");
});

test("partner leads need a valid partnership type and store its label", async () => {
	consentPortal.isConfigured = () => false;
	const app = buildApp();
	const partner = {
		type: "partner",
		name: "Meera",
		email: freshEmail(),
		phone: "9000000001",
		company: "Integrator Co",
		partnershipType: "technology",
		message: "We'd like to integrate.",
	};
	const bad = await start(app, freshIp(), { ...partner, partnershipType: "franchise" });
	assert.equal(bad.status, 400);

	const ok = await start(app, freshIp(), partner);
	assert.equal(ok.status, 201);
	const saved = await prisma.contactSubmission.findFirst({ where: { email: partner.email } });
	assert.equal(saved.type, "partner");
	assert.equal(saved.partnershipType, "technology");
	assert.equal(saved.service, "Technology Integration");
	assert.equal(saved.topic, null);
});

test("newsletter needs only name, email and phone, and uses the Newsletters department", async () => {
	portalOn();
	const email = freshEmail();
	const res = await start(buildApp(), freshIp(), { type: "newsletter", name: "Sam", email, phone: "9000000002" });
	assert.equal(res.status, 201);
	assert.equal(portalCalls[0].department, "Newsletters");
});

test("newsletter saved directly when verification is off", async () => {
	consentPortal.isConfigured = () => false;
	const email = freshEmail();
	await start(buildApp(), freshIp(), { type: "newsletter", name: "Sam", email, phone: "9000000003" });
	const saved = await prisma.contactSubmission.findFirst({ where: { email } });
	assert.equal(saved.type, "newsletter");
	assert.equal(saved.service, "Newsletter");
	assert.equal(saved.message, "");
});

test("fields that don't belong to the type are not stored", async () => {
	consentPortal.isConfigured = () => false;
	const email = freshEmail();
	await start(buildApp(), freshIp(), {
		...validLead,
		email,
		company: "Should Not Store",
		partnershipType: "reseller",
		preferredAt: futureIso(3),
	});
	const saved = await prisma.contactSubmission.findFirst({ where: { email } });
	assert.equal(saved.type, "contact");
	assert.equal(saved.company, null);
	assert.equal(saved.partnershipType, null);
	assert.equal(saved.preferredAt, null);
});

test("config uses the type's department and falls back to contact for unknown types", async () => {
	consentPortal.isConfigured = () => true;
	const asked = [];
	consentPortal.getConsentNotices = async department => {
		asked.push(department);
		return {};
	};
	await request(buildApp()).get("/api/contact/config?type=newsletter");
	await request(buildApp()).get("/api/contact/config?type=<script>");
	await request(buildApp()).get("/api/contact/config");
	assert.deepEqual(asked, ["Newsletters", "Contact Us", "Contact Us"]);
});
