const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");

const testDbPath = path.join(__dirname, "../../data/test-contact-cap.db");
process.env.DATABASE_URL = `file:${testDbPath}`;

// Same isolation as contact.test.js: these tests stub consentPortal/recaptcha
// directly, so real values left in backend/.env (a dev convenience) must not
// leak in and produce a live-configured backend.
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

// Make the module-level global send limiter testable without 100 requests.
process.env.CONTACT_GLOBAL_SEND_CAP = "2";

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

// Requiring the Prisma client can itself load backend/.env (dotenv doesn't
// overwrite vars that are already set, but ours were just deleted above), so
// clear them again here in case that happened.
for (const name of REAL_ENV_VARS_TO_CLEAR) delete process.env[name];

const consentPortal = require("../lib/consentPortal");
const recaptcha = require("../lib/recaptcha");
const contactRouter = require("./contact");

const original = {
	isConfigured: consentPortal.isConfigured,
	createConsent: consentPortal.createConsent,
	verifyRecaptcha: recaptcha.verifyRecaptcha,
};

function buildApp() {
	const app = express();
	app.set("trust proxy", "loopback");
	app.use(express.json());
	app.use("/api/contact", contactRouter);
	return app;
}

function portalOn() {
	consentPortal.isConfigured = () => true;
	consentPortal.createConsent = async args => (args.otp ? { status: "Success" } : { otp: "123456" });
	recaptcha.verifyRecaptcha = async () => true;
}

test.afterEach(() => {
	Object.assign(consentPortal, {
		isConfigured: original.isConfigured,
		createConsent: original.createConsent,
	});
	recaptcha.verifyRecaptcha = original.verifyRecaptcha;
});

const validLead = {
	name: "Jane Doe",
	email: "jane@example.com",
	phone: "9876543210",
	topic: "dpo_service",
	message: "We need a DPO.",
	tracking: { utm: "", referrer: "" },
};

function start(app, ip, email) {
	return request(app)
		.post("/api/contact/start")
		.set("X-Forwarded-For", ip)
		.send({ ...validLead, email });
}

test("the global OTP send cap refuses sends past CONTACT_GLOBAL_SEND_CAP within the hour", async () => {
	portalOn();
	const app = buildApp();

	const first = await start(app, "10.1.0.1", "cap1@example.com");
	assert.equal(first.status, 201);

	const second = await start(app, "10.1.0.2", "cap2@example.com");
	assert.equal(second.status, 201);

	const third = await start(app, "10.1.0.3", "cap3@example.com");
	assert.equal(third.status, 429);
	assert.match(third.body.message, /info@dpdpconsultants\.com/);
});
