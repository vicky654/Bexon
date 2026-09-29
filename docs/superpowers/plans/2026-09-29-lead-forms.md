# Lead Forms on One Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Book a Consultation, Partner With Us and Newsletter lead forms that run on the existing Contact Us OTP/consent engine, with per-type portal departments, per-type thank-you copy, and an admin inbox with type tabs and CSV export.

**Architecture:** A backend `leadTypes.js` config (fields, required list, portal department) drives validation and the portal department in the existing `/api/contact/*` routes, which gain a `type` field. `ContactSubmission`/`ContactVerification` gain `type`, `company`, `partnershipType`, `preferredAt`. On the site, a mirrored `leadForms.js` config drives a generalised `useContactForm(type)` hook and `ContactFormBody`, reused by three new pages. Admin messages get a `?type=` filter, per-type counts, and a CSV export endpoint.

**Tech Stack:** Express 5, Prisma 6 (SQLite), `node:test` + supertest; Next.js 16 / React 19 (site and admin).

**Spec:** `docs/superpowers/specs/2026-09-29-lead-forms-design.md`

## Global Constraints

- Lead types and portal departments exactly: `contact` → `Contact Us`, `consultation` → `Sales Enquiry`, `partner` → `Contact Us`, `newsletter` → `Newsletters`.
- Missing `type` → `contact`; unknown `type` → 400 `Unknown form type.`
- Partnership types exactly: `reseller` "Reseller / Referral", `technology` "Technology Integration", `consulting` "Consulting / Implementation", `other` "Other".
- `preferredAt` must be between now + 1 day and now + 1 calendar month; error `Please choose a time between tomorrow and one month from now.`
- Limits: name ≤ 100, email valid ≤ 254, phone exactly 10 digits, company ≤ 150, message ≤ 5000.
- Existing security unchanged: hashed OTP only, atomic attempt reservation, IP/email/global send limiters, test-address rule, OTP never sent to the browser.
- Thank-you copy per type (exact):
  - contact: "Thank you for contacting DPDP Consultants; Our Privacy Expert will reach out to you shortly."
  - consultation: "Thank you for booking a consultation. Our team will confirm your slot shortly."
  - partner: "Thank you for your interest in partnering with DPDP Consultants. Our partnerships team will get in touch."
  - newsletter: "You're subscribed. Welcome to the DPDP Consultants newsletter."
- CSV cells starting with `=`, `+`, `-`, `@`, tab or carriage return are prefixed with `'`.
- Code style: tabs, double quotes, semicolons; CommonJS in `backend/`, ES modules in `src/` and `admin/src/`. Never print or modify `backend/.env`.

## Review Focus

1. **A consultation submitted with no preferred time** → accepted (it's optional), saved with `preferredAt` null. Test in Task 3.
2. **Fields that don't belong to the type** (e.g. `partnershipType` sent with a contact form) → ignored, not stored. Test in Task 3.
3. **`/config?type=` with garbage** → falls back to contact's department, never passes the raw value to the portal. Test in Task 3.
4. **CSV with quotes, commas, newlines and a formula-looking message** → one row per lead, opens cleanly, formula neutralised. Test in Task 4.
5. **Footer newsletter box with an email** → lands on `/subscribe` with the email pre-filled. Checked in Task 6 smoke test.

---

### Task 1: Schema

**Files:**
- Modify: `backend/prisma/schema.prisma` (models `ContactSubmission`, `ContactVerification`)
- Create: `backend/prisma/migrations/<timestamp>_add_lead_types/migration.sql` (generated)

**Interfaces:**
- Produces: both models gain `type String @default("contact")`, `company String?`, `partnershipType String?`, `preferredAt DateTime?`.

- [ ] **Step 1: Edit the schema**

In `model ContactSubmission`, add after `phone`:
```prisma
  type            String    @default("contact")
  company         String?
  partnershipType String?
  preferredAt     DateTime?
```
In `model ContactVerification`, add after `phone`:
```prisma
  type            String    @default("contact")
  company         String?
  partnershipType String?
  preferredAt     DateTime?
```
Keep the existing column alignment style of each model.

- [ ] **Step 2: Generate the migration**

Stop the backend dev server first if running (Windows DLL lock).
Run: `cd backend && npx prisma migrate dev --name add_lead_types`
Expected: migration created; existing rows get `type = 'contact'`.

- [ ] **Step 3: Run the backend suite**

Run: `cd backend && npm test` → all pass.

- [ ] **Step 4: Commit**

```bash
git add backend/prisma
git commit -m "Add lead type, company, partnership type and preferred time to contact leads"
```

---

### Task 2: Lead type config and validation

**Files:**
- Create: `backend/src/lib/leadTypes.js`, `backend/src/lib/leadTypes.test.js`

**Interfaces:**
- Consumes: `CONTACT_TOPICS` from `backend/src/lib/contactHelpers.js`.
- Produces:
  - `LEAD_TYPES: { [type]: { label, department, fields: string[], required: string[] } }`
  - `PARTNERSHIP_TYPES: { reseller, technology, consulting, other }` → labels
  - `isLeadType(type): boolean`
  - `validateLead(type, lead, now = new Date()): string | null` — `lead.preferredAt` is a string ("" = not given)
  - `normalizeLead(type, lead): lead` — returns a copy with fields outside `LEAD_TYPES[type].fields` set to `""`, and `preferredAt` converted to a `Date` or `null`

- [ ] **Step 1: Write the failing tests** (`backend/src/lib/leadTypes.test.js`)

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { LEAD_TYPES, PARTNERSHIP_TYPES, isLeadType, validateLead, normalizeLead } = require("./leadTypes");

const NOW = new Date("2026-10-01T10:00:00.000Z");
const base = {
	name: "Jane Doe",
	email: "jane@example.com",
	phone: "9876543210",
	company: "Acme",
	topic: "dpo_service",
	partnershipType: "reseller",
	preferredAt: "",
	message: "Hello",
};

test("departments match the old site", () => {
	assert.equal(LEAD_TYPES.contact.department, "Contact Us");
	assert.equal(LEAD_TYPES.consultation.department, "Sales Enquiry");
	assert.equal(LEAD_TYPES.partner.department, "Contact Us");
	assert.equal(LEAD_TYPES.newsletter.department, "Newsletters");
	assert.equal(Object.keys(PARTNERSHIP_TYPES).length, 4);
});

test("isLeadType accepts only known types", () => {
	assert.equal(isLeadType("partner"), true);
	assert.equal(isLeadType("toString"), false);
	assert.equal(isLeadType(""), false);
});

test("unknown type is rejected", () => {
	assert.equal(validateLead("poem", base, NOW), "Unknown form type.");
});

test("each type accepts a complete lead", () => {
	for (const type of Object.keys(LEAD_TYPES)) {
		assert.equal(validateLead(type, base, NOW), null, type);
	}
});

test("newsletter needs only name, email and phone", () => {
	assert.equal(validateLead("newsletter", { name: "A", email: "a@b.co", phone: "9876543210" }, NOW), null);
	assert.ok(validateLead("newsletter", { name: "A", email: "a@b.co", phone: "" }, NOW));
});

test("consultation requires company and topic; message and time optional", () => {
	assert.ok(validateLead("consultation", { ...base, company: "" }, NOW));
	assert.ok(validateLead("consultation", { ...base, topic: "" }, NOW));
	assert.equal(validateLead("consultation", { ...base, message: "", preferredAt: "" }, NOW), null);
});

test("partner requires a known partnership type and a message", () => {
	assert.equal(validateLead("partner", { ...base, partnershipType: "" }, NOW), "Please choose a partnership type.");
	assert.equal(validateLead("partner", { ...base, partnershipType: "franchise" }, NOW), "Please choose a partnership type.");
	assert.ok(validateLead("partner", { ...base, message: "" }, NOW));
});

test("company is capped at 150 characters", () => {
	assert.ok(validateLead("partner", { ...base, company: "x".repeat(151) }, NOW));
	assert.equal(validateLead("partner", { ...base, company: "x".repeat(150) }, NOW), null);
});

test("preferredAt must be between tomorrow and one month from now", () => {
	const message = "Please choose a time between tomorrow and one month from now.";
	const at = iso => validateLead("consultation", { ...base, preferredAt: iso }, NOW);
	assert.equal(at("2026-10-01T12:00:00.000Z"), message); // today
	assert.equal(at("2026-10-02T10:00:00.000Z"), null); // exactly +1 day
	assert.equal(at("2026-11-01T10:00:00.000Z"), null); // exactly +1 month
	assert.equal(at("2026-11-02T10:00:00.000Z"), message); // past +1 month
	assert.equal(at("not a date"), message);
});

test("shared limits still apply", () => {
	assert.ok(validateLead("contact", { ...base, name: "x".repeat(101) }, NOW));
	assert.ok(validateLead("contact", { ...base, email: "nope" }, NOW));
	assert.ok(validateLead("contact", { ...base, phone: "12345" }, NOW));
	assert.ok(validateLead("contact", { ...base, topic: "business_strategy" }, NOW));
	assert.ok(validateLead("contact", { ...base, message: "x".repeat(5001) }, NOW));
});

test("normalizeLead drops fields the type doesn't use and parses the time", () => {
	const contact = normalizeLead("contact", base);
	assert.equal(contact.company, "");
	assert.equal(contact.partnershipType, "");
	assert.equal(contact.preferredAt, null);
	assert.equal(contact.topic, "dpo_service");

	const consult = normalizeLead("consultation", { ...base, preferredAt: "2026-10-05T09:30:00.000Z" });
	assert.ok(consult.preferredAt instanceof Date);
	assert.equal(consult.partnershipType, "");
	assert.equal(consult.company, "Acme");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && node --test src/lib/leadTypes.test.js` → FAIL (module not found).

- [ ] **Step 3: Implement `backend/src/lib/leadTypes.js`**

```js
const { CONTACT_TOPICS } = require("./contactHelpers");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\d{10}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const PARTNERSHIP_TYPES = {
	reseller: "Reseller / Referral",
	technology: "Technology Integration",
	consulting: "Consulting / Implementation",
	other: "Other",
};

// Department names are the ones the old site sent, so the consent portal
// already has consent templates for them.
const LEAD_TYPES = {
	contact: {
		label: "Contact",
		department: "Contact Us",
		fields: ["name", "email", "phone", "topic", "message"],
		required: ["name", "email", "phone", "topic", "message"],
	},
	consultation: {
		label: "Consultation",
		department: "Sales Enquiry",
		fields: ["name", "email", "phone", "company", "topic", "preferredAt", "message"],
		required: ["name", "email", "phone", "company", "topic"],
	},
	partner: {
		label: "Partner",
		department: "Contact Us",
		fields: ["name", "email", "phone", "company", "partnershipType", "message"],
		required: ["name", "email", "phone", "company", "partnershipType", "message"],
	},
	newsletter: {
		label: "Newsletter",
		department: "Newsletters",
		fields: ["name", "email", "phone"],
		required: ["name", "email", "phone"],
	},
};

const OPTIONAL_FIELDS = ["company", "topic", "partnershipType", "preferredAt", "message"];

function isLeadType(type) {
	return typeof type === "string" && Object.prototype.hasOwnProperty.call(LEAD_TYPES, type);
}

function oneMonthAfter(date) {
	const result = new Date(date);
	result.setMonth(result.getMonth() + 1);
	return result;
}

function validateLead(type, lead, now = new Date()) {
	if (!isLeadType(type)) return "Unknown form type.";
	const { fields, required } = LEAD_TYPES[type];
	const needs = field => required.includes(field);
	const uses = field => fields.includes(field);

	if (!lead.name) return "Please enter your name.";
	if (lead.name.length > 100) return "Please keep your name under 100 characters.";
	if (!emailPattern.test(lead.email || "") || lead.email.length > 254) return "Please provide a valid email address.";
	if (!phonePattern.test(lead.phone || "")) return "Please provide a 10-digit phone number.";

	if (uses("company")) {
		if (needs("company") && !lead.company) return "Please enter your company name.";
		if ((lead.company || "").length > 150) return "Please keep the company name under 150 characters.";
	}
	if (uses("topic") && (needs("topic") || lead.topic) && !CONTACT_TOPICS[lead.topic]) {
		return "Please choose the purpose of reaching out.";
	}
	if (uses("partnershipType") && (needs("partnershipType") || lead.partnershipType) && !PARTNERSHIP_TYPES[lead.partnershipType]) {
		return "Please choose a partnership type.";
	}
	if (uses("preferredAt") && lead.preferredAt) {
		const at = new Date(lead.preferredAt);
		const earliest = new Date(now.getTime() + DAY_MS);
		if (Number.isNaN(at.getTime()) || at < earliest || at > oneMonthAfter(now)) {
			return "Please choose a time between tomorrow and one month from now.";
		}
	}
	if (uses("message")) {
		if (needs("message") && !lead.message) return "Please enter a message.";
		if ((lead.message || "").length > 5000) return "Please keep your message under 5000 characters.";
	}
	return null;
}

function normalizeLead(type, lead) {
	const { fields } = LEAD_TYPES[type];
	const result = { ...lead };
	for (const field of OPTIONAL_FIELDS) {
		if (!fields.includes(field)) result[field] = "";
	}
	result.preferredAt = result.preferredAt ? new Date(result.preferredAt) : null;
	return result;
}

module.exports = { LEAD_TYPES, PARTNERSHIP_TYPES, isLeadType, validateLead, normalizeLead };
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd backend && node --test src/lib/leadTypes.test.js` → PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/leadTypes.js backend/src/lib/leadTypes.test.js
git commit -m "Add lead type config with per-type validation"
```

---

### Task 3: Contact routes and email per lead type

**Files:**
- Modify: `backend/src/routes/contact.js`, `backend/src/lib/mailer.js` (`sendContactNotification` only), `backend/.env.example` (remove the `CONSENT_DEPARTMENT=Contact Us` line)
- Test: `backend/src/routes/contact.test.js` (append tests; existing tests must still pass unchanged)

**Interfaces:**
- Consumes: Task 1 columns; Task 2 `LEAD_TYPES`, `PARTNERSHIP_TYPES`, `isLeadType`, `validateLead`, `normalizeLead`.
- Produces HTTP API (unchanged paths): `GET /api/contact/config?type=` and `POST /api/contact/start` body gains `type`, `company`, `partnershipType`, `preferredAt` (ISO string). Saved `ContactSubmission` rows carry `type`, `company`, `partnershipType`, `preferredAt`; `service` = purpose label (contact/consultation), partnership label (partner), or `"Newsletter"`; `topic` = purpose label or null.

- [ ] **Step 1: Write the failing tests** (append to `backend/src/routes/contact.test.js`, reusing its helpers `buildApp`, `freshIp`, `freshEmail`, `portalOn`, `start`, `validLead`)

```js
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
	assert.equal(res.body.message, "Please choose a time between tomorrow and one month from now.");
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
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd backend && node --test src/routes/contact.test.js` → the new tests FAIL (type ignored / department is "Contact Us").

- [ ] **Step 3: Update `backend/src/routes/contact.js`**

1. Imports: replace the `CONTACT_TOPICS` import usage — keep `CONTACT_TOPICS` from `contactHelpers` and add:
```js
const { LEAD_TYPES, PARTNERSHIP_TYPES, isLeadType, validateLead, normalizeLead } = require("../lib/leadTypes");
```
Remove `emailPattern`, `phonePattern` and the local `validateLead` function (validation now lives in `leadTypes.js`).

2. Replace `function department()` with:
```js
function departmentFor(type) {
	return LEAD_TYPES[isLeadType(type) ? type : "contact"].department;
}
```

3. Replace `readLead` with:
```js
function readLead(body) {
	const tracking = body.tracking && typeof body.tracking === "object" ? body.tracking : {};
	return {
		type: text(body.type) || "contact",
		name: text(body.name),
		email: text(body.email).toLowerCase(),
		phone: text(body.phone),
		company: text(body.company),
		topic: text(body.topic),
		partnershipType: text(body.partnershipType),
		preferredAt: text(body.preferredAt),
		message: text(body.message),
		utm: text(tracking.utm).slice(0, 500),
		referrer: text(tracking.referrer).slice(0, 500),
	};
}
```

4. `requestOtp(lead)`: use `department: departmentFor(lead.type)`.

5. `saveLead`: replace the `topicLabel`/`data` block with:
```js
	const topicLabel = CONTACT_TOPICS[lead.topic] || null;
	const serviceLabel =
		lead.type === "partner"
			? PARTNERSHIP_TYPES[lead.partnershipType]
			: lead.type === "newsletter"
				? "Newsletter"
				: topicLabel;
	const data = {
		type: lead.type,
		name: lead.name,
		email: lead.email,
		phone: lead.phone,
		company: lead.company || null,
		partnershipType: lead.partnershipType || null,
		preferredAt: lead.preferredAt || null,
		service: serviceLabel,
		topic: topicLabel,
		message: lead.message,
		language,
		utm: lead.utm,
		referrer: lead.referrer,
		device: lead.device,
		ip: lead.ip,
		consentRecorded,
	};
```

6. `leadFromVerification`: after spreading, keep `preferredAt` as a Date (Prisma returns a Date already) — no change needed beyond the spread.

7. `/config`: replace `department()` with `departmentFor(req.query.type)`.

8. `/start`: replace the first three lines with:
```js
	const raw = readLead(req.body || {});
	if (!isLeadType(raw.type)) return res.status(400).json({ message: "Unknown form type." });
	const error = validateLead(raw.type, raw);
	if (error) return res.status(400).json({ message: error });
	const lead = normalizeLead(raw.type, raw);
```
and add to the `contactVerification.create` data: `type: lead.type, company: lead.company || null, partnershipType: lead.partnershipType || null, preferredAt: lead.preferredAt,`.

9. `/verify`: in the `createConsent` call use `department: departmentFor(lead.type)`.

- [ ] **Step 4: Update `sendContactNotification` in `backend/src/lib/mailer.js`**

Add `type, company, partnershipType, preferredAt` to the destructured params, require `LEAD_TYPES` from `./leadTypes` at the top, and change subject and body:
```js
		subject: `New ${(LEAD_TYPES[type] || LEAD_TYPES.contact).label} lead${service ? ` - ${service}` : ""}`,
```
Add these lines to the `text` array right after `Name`/`Email`/`Phone`:
```js
			`Type: ${(LEAD_TYPES[type] || LEAD_TYPES.contact).label}`,
			company ? `Company: ${company}` : null,
			preferredAt ? `Preferred time: ${new Date(preferredAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST` : null,
```
(`service` already carries the purpose or partnership label.) If `mailer.test.js` asserts the old subject text, update that assertion to the new format.

- [ ] **Step 5: Remove `CONSENT_DEPARTMENT=Contact Us` from `backend/.env.example`.**

- [ ] **Step 6: Run the backend suite**

Run: `cd backend && npm test` → all PASS, including the 9 new tests and every existing contact test.

- [ ] **Step 7: Commit**

```bash
git add backend/src/routes/contact.js backend/src/routes/contact.test.js backend/src/lib/mailer.js backend/src/lib/mailer.test.js backend/.env.example
git commit -m "Route consultation, partner and newsletter leads through the contact engine"
```

---

### Task 4: Admin messages filter and CSV export

**Files:**
- Modify: `backend/src/routes/adminMessages.js`
- Test: `backend/src/routes/adminMessages.test.js` (append)

**Interfaces:**
- Consumes: `LEAD_TYPES`, `PARTNERSHIP_TYPES`, `isLeadType` (Task 2).
- Produces: `GET /api/admin/messages?type=` → `{ messages, counts: { all, contact, consultation, partner, newsletter } }`; `GET /api/admin/messages/export.csv?type=` → `text/csv` attachment.

- [ ] **Step 1: Write the failing tests** (append to `adminMessages.test.js`)

```js
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

test("export requires admin auth", async () => {
	const res = await request(buildApp()).get("/api/admin/messages/export.csv");
	assert.equal(res.status, 401);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd backend && node --test src/routes/adminMessages.test.js` → new tests FAIL.

- [ ] **Step 3: Implement in `backend/src/routes/adminMessages.js`**

Add after the router setup:
```js
const { LEAD_TYPES, PARTNERSHIP_TYPES, isLeadType } = require("../lib/leadTypes");

function typeFilter(query) {
	return isLeadType(query.type) ? { type: query.type } : {};
}

async function typeCounts() {
	const grouped = await prisma.contactSubmission.groupBy({ by: ["type"], _count: { _all: true } });
	const counts = { all: 0 };
	for (const type of Object.keys(LEAD_TYPES)) counts[type] = 0;
	for (const row of grouped) {
		counts[row.type] = row._count._all;
		counts.all += row._count._all;
	}
	return counts;
}

// Leading =, +, -, @, tab or CR make spreadsheets treat a cell as a formula.
function csvCell(value) {
	let cell = value === null || value === undefined ? "" : String(value);
	if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`;
	return /[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

const CSV_COLUMNS = [
	["Received", m => m.createdAt.toISOString()],
	["Type", m => (LEAD_TYPES[m.type] || LEAD_TYPES.contact).label],
	["Name", m => m.name],
	["Email", m => m.email],
	["Phone", m => m.phone],
	["Company", m => m.company],
	["Purpose", m => m.topic],
	["Partnership type", m => PARTNERSHIP_TYPES[m.partnershipType] || ""],
	["Preferred time", m => (m.preferredAt ? m.preferredAt.toISOString() : "")],
	["Message", m => m.message],
	["Consent recorded", m => (m.consentRecorded ? "Yes" : "No")],
	["Language", m => m.language],
	["UTM", m => m.utm],
	["Referrer", m => m.referrer],
];
```

Replace the `GET /` handler with:
```js
router.get("/", async (req, res) => {
	const messages = await prisma.contactSubmission.findMany({
		where: typeFilter(req.query),
		orderBy: { createdAt: "desc" },
	});
	res.json({ messages, counts: await typeCounts() });
});

router.get("/export.csv", async (req, res) => {
	const where = typeFilter(req.query);
	const messages = await prisma.contactSubmission.findMany({ where, orderBy: { createdAt: "desc" } });
	const lines = [
		CSV_COLUMNS.map(([heading]) => csvCell(heading)).join(","),
		...messages.map(message => CSV_COLUMNS.map(([, read]) => csvCell(read(message))).join(",")),
	];
	const date = new Date().toISOString().slice(0, 10);
	res.setHeader("Content-Type", "text/csv; charset=utf-8");
	res.setHeader("Content-Disposition", `attachment; filename="dpdp-leads-${where.type || "all"}-${date}.csv"`);
	// BOM so Excel opens the file as UTF-8.
	res.send(`﻿${lines.join("\r\n")}\r\n`);
});
```
(`router.use(requireAdmin)` already protects both.)

- [ ] **Step 4: Run** `cd backend && npm test` → all PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/adminMessages.js backend/src/routes/adminMessages.test.js
git commit -m "Filter admin messages by lead type and export them as CSV"
```

---

### Task 5: Site form engine per lead type

**Files:**
- Create: `src/libs/leadForms.js`
- Modify: `src/hooks/useContactForm.js`, `src/components/sections/contacts/ContactFormBody.js`, `src/components/sections/contacts/Contact2.js`, `src/components/sections/contacts/Contact3.js`, `src/app/api/contact/config/route.js`, `src/components/sections/contacts/ThankYouPrimary.js`, `src/app/thank-you/page.js`

**Interfaces:**
- Consumes: backend API from Task 3 via existing proxies; `CONTACT_TOPIC_OPTIONS` from `src/libs/contactTopics.js`.
- Produces:
  - `LEAD_FORMS[type] = { fields: string[], required: string[], submitText, thankYou }`, `leadForm(type)` (unknown → contact), `PARTNERSHIP_OPTIONS`
  - `useContactForm(type = "contact", { initialEmail = "" } = {})` — returns everything it returns today plus `type`, `fields`, `required`, `handlePartnershipChange`
  - `<ContactFormBody form={...} submitText={...} />` renders `form.fields`
  - `<ThankYouPrimary type={type} />`

- [ ] **Step 1: Create `src/libs/leadForms.js`**

```js
// Mirrors backend/src/lib/leadTypes.js (fields and required lists).
export const PARTNERSHIP_OPTIONS = [
	{ value: "", optionName: "Partnership type *" },
	{ value: "reseller", optionName: "Reseller / Referral" },
	{ value: "technology", optionName: "Technology Integration" },
	{ value: "consulting", optionName: "Consulting / Implementation" },
	{ value: "other", optionName: "Other" },
];

export const LEAD_FORMS = {
	contact: {
		fields: ["name", "email", "phone", "topic", "message"],
		required: ["name", "email", "phone", "topic", "message"],
		submitText: "Submit Now",
		thankYou: "Thank you for contacting DPDP Consultants; Our Privacy Expert will reach out to you shortly.",
	},
	consultation: {
		fields: ["name", "email", "phone", "company", "topic", "preferredAt", "message"],
		required: ["name", "email", "phone", "company", "topic"],
		submitText: "Book Consultation",
		thankYou: "Thank you for booking a consultation. Our team will confirm your slot shortly.",
	},
	partner: {
		fields: ["name", "email", "phone", "company", "partnershipType", "message"],
		required: ["name", "email", "phone", "company", "partnershipType", "message"],
		submitText: "Send Enquiry",
		thankYou:
			"Thank you for your interest in partnering with DPDP Consultants. Our partnerships team will get in touch.",
	},
	newsletter: {
		fields: ["name", "email", "phone"],
		required: ["name", "email", "phone"],
		submitText: "Subscribe",
		thankYou: "You're subscribed. Welcome to the DPDP Consultants newsletter.",
	},
};

export function isLeadFormType(type) {
	return typeof type === "string" && Object.prototype.hasOwnProperty.call(LEAD_FORMS, type);
}

export function leadForm(type) {
	return LEAD_FORMS[isLeadFormType(type) ? type : "contact"];
}
```

- [ ] **Step 2: Generalise `src/hooks/useContactForm.js`**

Changes (keep everything else as is):
1. Import `{ isLeadFormType, leadForm }` from `@/libs/leadForms`.
2. Replace `initialFormData` with:
```js
const emptyFormData = {
	name: "",
	email: "",
	phone: "",
	company: "",
	topic: "",
	partnershipType: "",
	preferredAt: "",
	message: "",
};

const REQUIRED_MESSAGES = {
	name: "Please enter your name.",
	company: "Please enter your company name.",
	topic: "Please choose the purpose of reaching out.",
	partnershipType: "Please choose a partnership type.",
	message: "Please enter a message.",
};
```
3. Signature and state:
```js
const useContactForm = (type = "contact", { initialEmail = "" } = {}) => {
	const formType = isLeadFormType(type) ? type : "contact";
	const { fields, required } = leadForm(formType);
	...
	const [formData, setFormData] = useState({ ...emptyFormData, email: initialEmail.toLowerCase() });
```
4. Config fetch: `fetch(\`/api/contact/config?type=${formType}\`)` with `[formType]` as the effect dependency.
5. Add `handlePartnershipChange`:
```js
	const handlePartnershipChange = option => {
		setFormData(prev => ({ ...prev, partnershipType: option?.value || "" }));
	};
```
6. `finish`: `router.push(\`/thank-you?type=${formType}\`);`
7. Replace the validation block at the top of `handleSubmit` with:
```js
		for (const field of ["name", "company", "topic", "partnershipType", "message"]) {
			if (required.includes(field) && !String(formData[field]).trim()) {
				creteAlert("error", REQUIRED_MESSAGES[field]);
				return;
			}
		}
		if (!emailPattern.test(formData.email.trim())) {
			creteAlert("error", "Please enter a valid email address.");
			return;
		}
		if (formData.phone.length !== 10) {
			creteAlert("error", "Please enter a 10-digit phone number.");
			return;
		}
```
8. Replace the `/start` body with:
```js
			const payload = { type: formType, tracking: readTracking() };
			for (const field of fields) payload[field] = formData[field];
			if (payload.preferredAt) payload.preferredAt = new Date(payload.preferredAt).toISOString();
			const { ok, data } = await postJson("/api/contact/start", payload);
```
9. Add `type: formType, fields, required, handlePartnershipChange` to the returned object.

- [ ] **Step 3: Render fields from config in `ContactFormBody.js`**

Replace the five hard-coded field blocks (name, email, phone, topic select, message) with a loop over `form.fields`, keeping the OTP section, submit button and modal exactly as they are. Add at the top of the component:
```js
	const star = field => (form.required.includes(field) ? " *" : "");
	const [timeBounds, setTimeBounds] = useState({ min: "", max: "" });

	// datetime-local wants local "YYYY-MM-DDTHH:mm"; computed after mount so
	// server and client render the same markup.
	useEffect(() => {
		const toLocal = date => {
			const offset = date.getTimezoneOffset() * 60000;
			return new Date(date.getTime() - offset).toISOString().slice(0, 16);
		};
		const min = new Date(Date.now() + 24 * 60 * 60 * 1000);
		const max = new Date();
		max.setMonth(max.getMonth() + 1);
		setTimeBounds({ min: toLocal(min), max: toLocal(max) });
	}, []);
```
Import `PARTNERSHIP_OPTIONS` from `@/libs/leadForms`. Each field renders inside the same wrappers used today:

| field | wrapper | element |
|---|---|---|
| name | `col-sm-6` / `form-input` | `<input type="text" name="name" maxLength={100} placeholder={\`Full Name${star("name")}\`} …>` |
| email | `col-sm-6` | `<input type="email" name="email" maxLength={254} placeholder={\`Email Address${star("email")}\`} …>` |
| phone | `col-sm-6` | as today, placeholder `Phone number${star("phone")}` |
| company | `col-sm-6` | `<input type="text" name="company" maxLength={150} placeholder={\`Company Name${star("company")}\`} …>` |
| topic | `col-sm-6` | the existing `ReactNiceSelect` with `CONTACT_TOPIC_OPTIONS` and `form.handleTopicChange` |
| partnershipType | `col-sm-6` | `ReactNiceSelect` with `PARTNERSHIP_OPTIONS` and `form.handlePartnershipChange`, same locked styling |
| preferredAt | `col-sm-6` | `<label className="d-block mb-1" htmlFor="preferredAt">Preferred date &amp; time (optional)</label><input id="preferredAt" type="datetime-local" name="preferredAt" min={timeBounds.min} max={timeBounds.max} value={form.formData.preferredAt} onChange={form.handleChange} disabled={locked}>` |
| message | `col-sm-12` / `form-input message-input` | the existing textarea, placeholder `Type message${star("message")}` |

Every input keeps `value={form.formData[field]}`, `onChange={form.handleChange}`, `disabled={locked}`. Render with `form.fields.map(field => <Fragment key={field}>…</Fragment>)` via a small `renderField(field)` function inside the component.

- [ ] **Step 4: Contact2 / Contact3**

Change `useContactForm()` to `useContactForm("contact")` (behaviour unchanged).

- [ ] **Step 5: Pass `type` through the config proxy** (`src/app/api/contact/config/route.js`)

```js
import { forwardContactRequest } from "@/libs/contactProxy";

export async function GET(request) {
	const type = new URL(request.url).searchParams.get("type") || "";
	const query = type ? `?type=${encodeURIComponent(type)}` : "";
	return forwardContactRequest(request, `/config${query}`, "GET");
}
```

- [ ] **Step 6: Per-type thank-you**

`ThankYouPrimary.js`: accept `{ type }`, import `leadForm` from `@/libs/leadForms`, and render `{leadForm(type).thankYou}` in place of the hard-coded sentence. Conversion effect unchanged.

`src/app/thank-you/page.js`: make the page `export default async function ThankYou({ searchParams }) { const { type } = await searchParams; … <ThankYouPrimary type={type} /> … }`.

- [ ] **Step 7: Build**

Run: `npx next build` → "✓ Compiled successfully". Then `grep -rn "initialFormData" src` → no output.

- [ ] **Step 8: Commit**

```bash
git add src/libs/leadForms.js src/hooks/useContactForm.js src/components/sections/contacts src/app/api/contact/config/route.js src/app/thank-you/page.js
git commit -m "Drive the contact form from per-type field config"
```

---

### Task 6: Consultation, partner and subscribe pages; footer newsletter

**Files:**
- Create: `src/components/sections/contacts/LeadFormSection.js`, `src/app/book-consultation/page.js`, `src/app/partner-with-us/page.js`, `src/app/subscribe/page.js`
- Modify: `src/components/layout/footer/Footer.js` (subscribe form only)

**Interfaces:**
- Consumes: Task 5 `useContactForm(type, { initialEmail })`, `ContactFormBody`, `leadForm(type).submitText`.
- Produces: routes `/book-consultation`, `/partner-with-us`, `/subscribe?email=`.

- [ ] **Step 1: Create `LeadFormSection.js`**

```js
"use client";
import ContactFormBody from "@/components/sections/contacts/ContactFormBody";
import useContactForm from "@/hooks/useContactForm";
import { leadForm } from "@/libs/leadForms";
import Link from "next/link";

const LeadFormSection = ({ type, title, intro, points = [], initialEmail = "" }) => {
	const form = useContactForm(type, { initialEmail });

	return (
		<section className="tj-contact-section-2 section-bottom-gap">
			<div className="container">
				<div className="row">
					<div className="col-lg-5">
						<div className="sec-heading wow fadeInUp" data-wow-delay=".1s">
							<h2 className="sec-title title-anim">{title}</h2>
						</div>
						<p className="wow fadeInUp" data-wow-delay=".2s">{intro}</p>
						{points.length ? (
							<ul className="wow fadeInUp" data-wow-delay=".3s">
								{points.map(point => (
									<li key={point}>{point}</li>
								))}
							</ul>
						) : null}
						<p className="mt-4 wow fadeInUp" data-wow-delay=".4s">
							Prefer email? Write to{" "}
							<Link href="mailto:info@dpdpconsultants.com">info@dpdpconsultants.com</Link> or call{" "}
							<Link href="tel:1800-5711333">1800-5711333</Link>.
						</p>
					</div>
					<div className="col-lg-7">
						<div className="contact-form wow fadeInUp" data-wow-delay=".1s">
							<form onSubmit={form.handleSubmit} noValidate>
								<ContactFormBody form={form} submitText={leadForm(type).submitText} />
							</form>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default LeadFormSection;
```

- [ ] **Step 2: Create the three pages**

Each follows `src/app/contact/page.js` (BackToTop, two Headers, smooth wrapper, HeaderSpace, HeroInner, section, Cta, Footer, ClientWrapper), replacing `ContactTop`/`Contact3` with `LeadFormSection`.

`src/app/book-consultation/page.js`:
```js
export const metadata = {
	title: "Book a DPDP Compliance Consultation | DPDP Consultants",
	description: "Schedule a call with DPDP Consultants to discuss your organization's DPDP compliance needs.",
};
// …inside <main>:
<HeroInner title={"Book a Consultation"} text={"Book a Consultation"} />
<LeadFormSection
	type="consultation"
	title="Book a DPDP Compliance Consultation"
	intro="Schedule a call with DPDP Consultants to discuss your organization's DPDP compliance needs. Our experts will guide you through requirements, clarify obligations, and help you plan a clear path to achieving and maintaining data protection compliance."
	points={["Gap assessment and remediation planning", "Live demonstrations of compliance tools", "Data Protection Officer as a Service"]}
/>
```

`src/app/partner-with-us/page.js`:
```js
export const metadata = {
	title: "Partner With Us | DPDP Consultants",
	description: "Collaborate with DPDP Consultants on data protection compliance initiatives.",
};
// …inside <main>:
<HeroInner title={"Partner With Us"} text={"Partner With Us"} />
<LeadFormSection
	type="partner"
	title="Partner With DPDP Consultants for Data Protection Compliance"
	intro="Collaborate with DPDP Consultants on data protection compliance initiatives. Partner with us to help clients meet regulatory requirements, strengthen privacy frameworks, and ensure robust data protection practices."
/>
```

`src/app/subscribe/page.js` (async page reading the email):
```js
export const metadata = {
	title: "Subscribe to Our Newsletter | DPDP Consultants",
	description: "Stay informed on the DPDP Act, rules, enforcement updates and practical privacy guidance.",
};

export default async function Subscribe({ searchParams }) {
	const { email } = await searchParams;
	const initialEmail = typeof email === "string" ? email.slice(0, 254) : "";
	// …layout as above, inside <main>:
	// <HeroInner title={"Newsletter"} text={"Newsletter"} />
	// <LeadFormSection type="newsletter" title="Subscribe to Our Newsletter"
	//   intro="Stay informed on the DPDP Act, rules, enforcement updates and practical privacy guidance, delivered to your inbox."
	//   initialEmail={initialEmail} />
}
```
Write all three files in full (no comments standing in for markup).

- [ ] **Step 3: Wire the footer newsletter box** (`src/components/layout/footer/Footer.js`)

Change the subscribe form to a plain GET form (no JS needed):
```jsx
<form action="/subscribe" method="get">
	<input type="email" name="email" placeholder="Enter email" maxLength={254} required />
	<button type="submit" aria-label="Subscribe">
		<i className="tji-plane"></i>
	</button>
	<label htmlFor="agree">
		<input id="agree" type="checkbox" required />
		Agree to our{" "}
		<Link href="/terms-and-conditions">Terms & Condition?</Link>
	</label>
</form>
```

- [ ] **Step 4: Build**

Run: `npx next build` → compiles; route list includes `/book-consultation`, `/partner-with-us`, `/subscribe`.

- [ ] **Step 5: Smoke test (verification off)**

`backend/.env` already has `CONSENT_API_BASE=` blank. Start backend (`cd backend && npm run dev`) and site (`npm run dev`) in the background; note the site port. Use yopmail addresses so nothing is saved or emailed:
```bash
for body in \
 '{"type":"consultation","name":"Smoke","email":"smoke1@yopmail.com","phone":"9876543210","company":"Acme","topic":"dpo_service"}' \
 '{"type":"partner","name":"Smoke","email":"smoke2@yopmail.com","phone":"9876543210","company":"Acme","partnershipType":"other","message":"hi"}' \
 '{"type":"newsletter","name":"Smoke","email":"smoke3@yopmail.com","phone":"9876543210"}'; do
 curl -s -X POST http://localhost:<port>/api/contact/start -H "Content-Type: application/json" -d "$body"; echo; done
```
Expected: `{"done":true}` three times. Then: `/book-consultation`, `/partner-with-us`, `/subscribe?email=a%40b.co` and `/thank-you?type=partner` each return 200; `curl -s "http://localhost:<port>/subscribe?email=a%40b.co" | grep -c 'value="a@b.co"'` → ≥ 1; `curl -s "http://localhost:<port>/thank-you?type=partner" | grep -c "partnerships team"` → ≥ 1. Stop both servers you started.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/contacts/LeadFormSection.js src/app/book-consultation src/app/partner-with-us src/app/subscribe src/components/layout/footer/Footer.js
git commit -m "Add consultation, partner and newsletter pages and wire the footer newsletter box"
```

---

### Task 7: Admin inbox tabs, type column and CSV export

**Files:**
- Create: `admin/src/lib/leadTypes.js`
- Modify: `admin/src/lib/api.js` (export `BACKEND_URL`), `admin/src/app/messages/page.js`, `admin/src/components/MessageDetailModal.js`, `admin/src/app/globals.css`

**Interfaces:**
- Consumes: Task 4 API (`messages`, `counts`, `export.csv`).

- [ ] **Step 1: `admin/src/lib/leadTypes.js`**

```js
export const LEAD_TYPE_TABS = [
	{ value: "all", label: "All" },
	{ value: "contact", label: "Contact" },
	{ value: "consultation", label: "Consultation" },
	{ value: "partner", label: "Partner" },
	{ value: "newsletter", label: "Newsletter" },
];

export const PARTNERSHIP_LABELS = {
	reseller: "Reseller / Referral",
	technology: "Technology Integration",
	consulting: "Consulting / Implementation",
	other: "Other",
};

export function leadTypeLabel(type) {
	return LEAD_TYPE_TABS.find(tab => tab.value === type)?.label || "Contact";
}
```

- [ ] **Step 2: `admin/src/lib/api.js`** — change `const BACKEND_URL` to `export const BACKEND_URL` (default export unchanged).

- [ ] **Step 3: Messages page**

- State `const [type, setType] = useState("all")` and `const [counts, setCounts] = useState(null)`.
- `loadMessages` fetches ``/api/admin/messages${type === "all" ? "" : `?type=${type}`}`` and sets both `messages` and `counts`; the effect depends on `[type]` (set `messages` to `null` when the tab changes so the skeleton shows).
- Above the table, a tab bar:
```jsx
<div className="filter-tabs" role="tablist">
	{LEAD_TYPE_TABS.map(tab => (
		<button
			key={tab.value}
			type="button"
			role="tab"
			aria-selected={type === tab.value}
			className={`filter-tab${type === tab.value ? " filter-tab-active" : ""}`}
			onClick={() => setType(tab.value)}
		>
			{tab.label}
			{counts ? <span className="filter-tab-count">{counts[tab.value] ?? 0}</span> : null}
		</button>
	))}
</div>
```
- In the page header, next to the title block, an export link:
```jsx
<a
	className="button button-secondary"
	href={`${BACKEND_URL}/api/admin/messages/export.csv${type === "all" ? "" : `?type=${type}`}`}
>
	Export CSV
</a>
```
- Table columns: Name, Email, **Type** (`<span className="badge badge-neutral">{leadTypeLabel(message.type)}</span>`), **Purpose** (`message.service || "-"`), Message, Status. Update the skeleton to `columns={6}`.

- [ ] **Step 4: Detail modal** — after the Phone entry add:
```jsx
<div>
	<dt>Type</dt>
	<dd>{leadTypeLabel(message.type)}</dd>
</div>
<div>
	<dt>Company</dt>
	<dd>{message.company || "—"}</dd>
</div>
<div>
	<dt>Partnership type</dt>
	<dd>{PARTNERSHIP_LABELS[message.partnershipType] || "—"}</dd>
</div>
<div>
	<dt>Preferred time</dt>
	<dd>{message.preferredAt ? formatDate(message.preferredAt) : "—"}</dd>
</div>
```

- [ ] **Step 5: CSS** (`admin/src/app/globals.css`, near the table styles)

```css
.filter-tabs {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin-bottom: 14px;
}

.filter-tab {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 7px 12px;
	border: 1px solid #d7dae2;
	border-radius: 999px;
	background: #fff;
	color: #454a5c;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
}

.filter-tab:hover {
	background: #f7f8fb;
}

.filter-tab-active {
	background: #101223;
	border-color: #101223;
	color: #fff;
}

.filter-tab-count {
	min-width: 18px;
	padding: 1px 6px;
	border-radius: 999px;
	background: rgba(0, 0, 0, 0.08);
	font-size: 11.5px;
	text-align: center;
}

.filter-tab-active .filter-tab-count {
	background: rgba(255, 255, 255, 0.2);
}
```

- [ ] **Step 6: Build** `cd admin && npx next build` → compiles.

- [ ] **Step 7: Commit**

```bash
git add admin/src/lib/leadTypes.js admin/src/lib/api.js admin/src/app/messages/page.js admin/src/components/MessageDetailModal.js admin/src/app/globals.css
git commit -m "Add lead type tabs, type column and CSV export to admin messages"
```
