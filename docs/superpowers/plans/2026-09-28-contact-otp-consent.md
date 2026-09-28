# Contact Form OTP + Consent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route every Contact Us submission through the DPDP consent portal — email OTP, consent notice, reCAPTCHA — before saving and emailing the lead, as the old PHP site did, but with the OTP verified server-side and all secrets in `.env`.

**Architecture:** The Express backend gains a small portal client (`lib/consentPortal.js`), a reCAPTCHA verifier, and three contact endpoints (`/config`, `/start`, `/resend`, `/verify`) that keep a hashed OTP in a new `ContactVerification` table. The Next.js site proxies those endpoints, and `useContactForm` becomes a two-step (form → OTP) flow with a consent modal, ending on a new `/thank-you` page that fires the Google Ads conversion.

**Tech Stack:** Express 5, Prisma 6 (SQLite), bcryptjs, jsonwebtoken, Node 22 global `fetch`, `node:test` + supertest; Next.js 16 / React 19.

**Spec:** `docs/superpowers/specs/2026-09-28-contact-otp-consent-design.md`

## Global Constraints

- The OTP (or anything derived from it other than a bcrypt hash) is never sent to the browser.
- No secret values in any committed file. Secrets only in `backend/.env` (gitignored). `.env.example` gets names only.
- Blank `CONSENT_API_BASE` ⇒ verification off: `/start` saves + emails directly and logs `Consent portal not configured, saving contact submission without OTP verification.`
- Blank `RECAPTCHA_SECRET` ⇒ reCAPTCHA check passes with log `RECAPTCHA_SECRET not configured, skipping reCAPTCHA check.`
- OTP valid 10 minutes; max 5 wrong entries; resend allowed after 30 seconds.
- Portal JWT: HS256, payload exactly `{ iss, aud, email, expiry }`, `expiry = now + 3600` (seconds), no `iat`.
- Department sent to the portal: `process.env.CONSENT_DEPARTMENT || "Contact Us"`. Default language: `"English"`.
- Emails containing `yopmail` or `dpdpconsultants` complete the flow but are not saved or emailed.
- Google Ads: base tag `AW-16540124026`, conversion `AW-16540124026/XOSvCLjTsasZEPqG-c49`.
- Thank-you copy: "Thank you for contacting DPDP Consultants; Our Privacy Expert will reach out to you shortly."
- Portal-down copy: "We couldn't send a verification code right now. Please try again, or email us at info@dpdpconsultants.com."
- Code style: tabs, double quotes, semicolons, CommonJS in `backend/`, ES modules in `src/` — match surrounding files.

## Review Focus

1. **Garbage request bodies** (non-string `name`, `tracking: "x"`, missing body) → 400 with a message, never a 500. Test in Task 4.
2. **Email typed with capitals/spaces** (`" Jane@Example.COM "`) → stored and sent to the portal trimmed and lowercased. Test in Task 4.
3. **Double-click on Agree** (two concurrent `/verify` with the right code) → exactly one submission saved, the other gets 410. Test in Task 4.
4. **Portal returns the OTP as a number** (`{ otp: 123456 }`) → still verifies when the visitor types `123456`. Test in Task 4.
5. **Portal answers 200 with an HTML error page** → treated as a failure (502 at `/start`), not a crash. Test in Task 2.

Known limits, accepted, not tested: per-IP limits trust `X-Forwarded-For`, which a direct caller of the backend can spoof; a visitor who reloads mid-OTP must start again; whether the portal's second `create_consent` response body signals success is unknown, so any 2xx JSON counts as recorded.

---

## File Map

| File | Responsibility |
|---|---|
| `backend/prisma/schema.prisma` | + `ContactVerification`, + tracking/consent columns on `ContactSubmission` |
| `backend/prisma/migrations/<ts>_add_contact_verification/` | generated migration |
| `backend/.env.example` | + consent portal and reCAPTCHA variable names |
| `backend/src/lib/contactHelpers.js` | topic list, device type, client IP, test-address rule, in-memory rate limiter |
| `backend/src/lib/consentPortal.js` | JWT signing, `template_details` (cached), `create_consent` |
| `backend/src/lib/recaptcha.js` | Google `siteverify` |
| `backend/src/lib/mailer.js` | notification email gains purpose/language/tracking/consent lines |
| `backend/src/routes/contact.js` | `/config`, `/start`, `/resend`, `/verify` (old `POST /` removed) |
| `src/libs/contactProxy.js` | shared Next→backend forwarder (passes IP + UA) |
| `src/app/api/contact/{config,start,resend,verify}/route.js` | proxy routes (old `route.js` deleted) |
| `src/libs/contactTopics.js` | purpose options for the dropdown |
| `src/libs/tracking.js` | read/write UTM + referrer in sessionStorage |
| `src/components/shared/others/TrackingCapture.js` | captures tracking on first page view |
| `src/components/shared/others/GoogleAdsTag.js` | gtag base script |
| `src/app/layout.js` | mounts the two components above |
| `src/components/shared/Inputs/Recaptcha.js` | explicit-render reCAPTCHA v2 widget |
| `src/components/sections/contacts/ConsentModal.js` | consent notice + language select |
| `src/components/sections/contacts/ContactFormBody.js` | shared fields + OTP step used by both forms |
| `src/hooks/useContactForm.js` | form → otp → done flow |
| `src/components/sections/contacts/Contact2.js`, `Contact3.js` | use `ContactFormBody` |
| `src/app/thank-you/page.js`, `src/components/sections/contacts/ThankYouPrimary.js` | thank-you page + conversion |
| `admin/src/components/MessageDetailModal.js` | shows new fields |

---

### Task 1: Database schema and env names

**Files:**
- Modify: `backend/prisma/schema.prisma` (model `ContactSubmission`, new model after it)
- Create: `backend/prisma/migrations/<timestamp>_add_contact_verification/migration.sql` (generated)
- Modify: `backend/.env.example`

**Interfaces:**
- Produces: `prisma.contactVerification` with fields `id String (uuid)`, `name`, `email`, `phone`, `topic`, `message`, `tracking` (JSON string `{utm, referrer, device, ip}`), `otpHash`, `attempts Int`, `lastSentAt DateTime`, `expiresAt DateTime`, `createdAt`. `prisma.contactSubmission` gains `topic?`, `language?`, `utm?`, `referrer?`, `device?`, `ip?`, `consentRecorded Boolean @default(false)`.

- [ ] **Step 1: Edit the schema**

Replace the `ContactSubmission` model and add `ContactVerification` directly below it:

```prisma
model ContactSubmission {
  id              Int      @id @default(autoincrement())
  name            String
  email           String
  phone           String?
  service         String?
  topic           String?
  message         String
  language        String?
  utm             String?
  referrer        String?
  device          String?
  ip              String?
  consentRecorded Boolean  @default(false)
  status          String   @default("new")
  createdAt       DateTime @default(now())
}

model ContactVerification {
  id         String   @id @default(uuid())
  name       String
  email      String
  phone      String
  topic      String
  message    String
  tracking   String
  otpHash    String
  attempts   Int      @default(0)
  lastSentAt DateTime @default(now())
  expiresAt  DateTime
  createdAt  DateTime @default(now())
}
```

- [ ] **Step 2: Generate the migration**

Stop the backend dev server first if it is running (Windows locks the Prisma engine DLL).

Run: `cd backend && npx prisma migrate dev --name add_contact_verification`
Expected: "Your database is now in sync with your schema" and a new folder under `prisma/migrations/`.

- [ ] **Step 3: Add env names to `backend/.env.example`**

Append after the SMTP block:

```
# Consent portal — sends the contact-form OTP by email and records the
# visitor's consent. Leave CONSENT_API_BASE blank to turn OTP off (the form
# then saves and emails submissions directly, as before).
CONSENT_API_BASE=
CONSENT_JWT_SECRET=
CONSENT_JWT_ISS=
CONSENT_JWT_AUD=
CONSENT_JWT_EMAIL=
CONSENT_DEPARTMENT=Contact Us

# Google reCAPTCHA v2 ("I'm not a robot" checkbox) for the contact form.
# Leave blank to skip the check. Google's public test keys only work for
# local testing — replace them before going live.
RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET=
```

- [ ] **Step 4: Run the existing backend tests**

Run: `cd backend && npm test`
Expected: all pass (the schema change is additive).

- [ ] **Step 5: Commit**

```bash
git add backend/prisma backend/.env.example
git commit -m "Add ContactVerification table and consent/tracking columns for contact leads"
```

---

### Task 2: Consent portal client

**Files:**
- Create: `backend/src/lib/consentPortal.js`
- Test: `backend/src/lib/consentPortal.test.js`

**Interfaces:**
- Produces (module object — routes call these as `consentPortal.fn(...)` so tests can replace them):
  - `isConfigured(): boolean`
  - `buildToken(): string`
  - `getConsentNotices(department: string): Promise<{ [language: string]: string /* HTML */ }>`
  - `createConsent({ name, email, phone, ipaddress, department, devicetype, language, otp? }): Promise<object /* parsed JSON */>` — throws on network error, non-2xx, or non-JSON body.
  - `_clearNoticeCache(): void` (tests only)

- [ ] **Step 1: Write the failing tests**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const consentPortal = require("./consentPortal");

const ENV = {
	CONSENT_API_BASE: "https://portal.example.com/",
	CONSENT_JWT_SECRET: "test-secret",
	CONSENT_JWT_ISS: "https://iss.example.com",
	CONSENT_JWT_AUD: "https://aud.example.com",
	CONSENT_JWT_EMAIL: "owner@example.com",
};

function withEnv(fn) {
	return async () => {
		Object.assign(process.env, ENV);
		const originalFetch = global.fetch;
		consentPortal._clearNoticeCache();
		try {
			await fn();
		} finally {
			global.fetch = originalFetch;
			for (const key of Object.keys(ENV)) delete process.env[key];
		}
	};
}

function jsonResponse(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

test("isConfigured is false without base URL or secret", () => {
	delete process.env.CONSENT_API_BASE;
	delete process.env.CONSENT_JWT_SECRET;
	assert.equal(consentPortal.isConfigured(), false);
});

test(
	"buildToken signs exactly iss/aud/email/expiry with HS256",
	withEnv(async () => {
		const decoded = jwt.verify(consentPortal.buildToken(), "test-secret", {
			algorithms: ["HS256"],
			audience: ENV.CONSENT_JWT_AUD,
			issuer: ENV.CONSENT_JWT_ISS,
		});
		assert.deepEqual(Object.keys(decoded).sort(), ["aud", "email", "expiry", "iss"]);
		assert.equal(decoded.email, "owner@example.com");
		const now = Math.floor(Date.now() / 1000);
		assert.ok(decoded.expiry > now + 3500 && decoded.expiry <= now + 3600);
	})
);

test(
	"createConsent posts a form with bearer token and returns the JSON",
	withEnv(async () => {
		let captured;
		global.fetch = async (url, init) => {
			captured = { url, init };
			return jsonResponse({ otp: "123456" });
		};

		const result = await consentPortal.createConsent({
			name: "Jane",
			email: "jane@example.com",
			phone: "9876543210",
			ipaddress: "1.2.3.4",
			department: "Contact Us",
			devicetype: "Desktop",
			language: "English",
		});

		assert.deepEqual(result, { otp: "123456" });
		assert.equal(captured.url, "https://portal.example.com/api/v2/create_consent");
		assert.equal(captured.init.method, "POST");
		assert.match(captured.init.headers.Authorization, /^Bearer /);
		const form = new URLSearchParams(captured.init.body.toString());
		assert.equal(form.get("email"), "jane@example.com");
		assert.equal(form.get("department"), "Contact Us");
		assert.equal(form.get("digi_type"), "parent");
		assert.equal(form.has("otp"), false);
	})
);

test(
	"createConsent includes the otp when given",
	withEnv(async () => {
		let body;
		global.fetch = async (url, init) => {
			body = new URLSearchParams(init.body.toString());
			return jsonResponse({ status: "Success" });
		};
		await consentPortal.createConsent({
			name: "Jane",
			email: "jane@example.com",
			phone: "9876543210",
			ipaddress: "1.2.3.4",
			department: "Contact Us",
			devicetype: "Desktop",
			language: "Hindi",
			otp: "654321",
		});
		assert.equal(body.get("otp"), "654321");
		assert.equal(body.get("language"), "Hindi");
	})
);

test(
	"createConsent throws on a non-2xx response",
	withEnv(async () => {
		global.fetch = async () => jsonResponse({ message: "nope" }, 401);
		await assert.rejects(() =>
			consentPortal.createConsent({ name: "a", email: "a@b.co", phone: "1", ipaddress: "", department: "x", devicetype: "" })
		);
	})
);

test(
	"createConsent throws when a 200 response is not JSON",
	withEnv(async () => {
		global.fetch = async () => new Response("<html>Server error</html>", { status: 200 });
		await assert.rejects(() =>
			consentPortal.createConsent({ name: "a", email: "a@b.co", phone: "1", ipaddress: "", department: "x", devicetype: "" })
		);
	})
);

test(
	"getConsentNotices maps languages to content and caches per department",
	withEnv(async () => {
		let calls = 0;
		let requestedUrl;
		global.fetch = async url => {
			calls += 1;
			requestedUrl = url;
			return jsonResponse({
				status: "Success",
				data: {
					English: { content: "<p>English notice</p>" },
					Hindi: { content: "<p>Hindi notice</p>" },
				},
			});
		};

		const first = await consentPortal.getConsentNotices("Contact Us");
		const second = await consentPortal.getConsentNotices("Contact Us");

		assert.deepEqual(first, { English: "<p>English notice</p>", Hindi: "<p>Hindi notice</p>" });
		assert.deepEqual(second, first);
		assert.equal(calls, 1);
		assert.equal(
			requestedUrl,
			"https://portal.example.com/api/v2/get/template_details?department_name=Contact+Us"
		);
	})
);

test(
	"getConsentNotices throws when the portal does not report Success",
	withEnv(async () => {
		global.fetch = async () => jsonResponse({ status: "Failed" });
		await assert.rejects(() => consentPortal.getConsentNotices("Contact Us"));
	})
);
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && node --test src/lib/consentPortal.test.js`
Expected: FAIL — `Cannot find module './consentPortal'`.

- [ ] **Step 3: Implement `backend/src/lib/consentPortal.js`**

```js
const jwt = require("jsonwebtoken");

const NOTICE_TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15 * 1000;
const noticeCache = new Map();

function isConfigured() {
	return Boolean(process.env.CONSENT_API_BASE && process.env.CONSENT_JWT_SECRET);
}

function baseUrl() {
	return process.env.CONSENT_API_BASE.replace(/\/+$/, "");
}

// Same claims the old PHP site signed with Firebase JWT: no iat, and a
// custom "expiry" claim rather than the standard "exp".
function buildToken() {
	return jwt.sign(
		{
			iss: process.env.CONSENT_JWT_ISS,
			aud: process.env.CONSENT_JWT_AUD,
			email: process.env.CONSENT_JWT_EMAIL,
			expiry: Math.floor(Date.now() / 1000) + 3600,
		},
		process.env.CONSENT_JWT_SECRET,
		{ algorithm: "HS256", noTimestamp: true }
	);
}

async function readJson(res, label) {
	const text = await res.text();
	let body = null;
	try {
		body = JSON.parse(text);
	} catch {
		body = null;
	}
	if (!res.ok || body === null || typeof body !== "object") {
		throw new Error(`Consent portal ${label} failed with status ${res.status}`);
	}
	return body;
}

async function getConsentNotices(department) {
	const cached = noticeCache.get(department);
	if (cached && Date.now() - cached.at < NOTICE_TTL_MS) return cached.notices;

	const query = new URLSearchParams({ department_name: department });
	const res = await fetch(`${baseUrl()}/api/v2/get/template_details?${query}`, {
		headers: { Authorization: `Bearer ${buildToken()}` },
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	});
	const body = await readJson(res, "template_details");

	if (body.status !== "Success" || !body.data || typeof body.data !== "object") {
		throw new Error("Consent portal returned no consent notices");
	}

	const notices = {};
	for (const [language, value] of Object.entries(body.data)) {
		if (value && typeof value.content === "string") notices[language] = value.content;
	}

	noticeCache.set(department, { at: Date.now(), notices });
	return notices;
}

// Called twice per lead: without otp the portal emails the visitor a code
// and returns it as `otp`; with otp it records the visitor's consent.
async function createConsent({ name, email, phone, ipaddress, department, devicetype, language, otp }) {
	const form = new URLSearchParams({
		name,
		email,
		phone,
		ipaddress: ipaddress || "",
		department,
		devicetype: devicetype || "",
		digi_type: "parent",
		digi_id: "",
		digi_locker_id: "",
		digi_name: "",
		digi_gender: "",
		digi_dob: "",
		digi_email: "",
		digi_mobile: "",
		digi_eaadhaar: "",
	});
	if (language) form.set("language", language);
	if (otp) form.set("otp", otp);

	const res = await fetch(`${baseUrl()}/api/v2/create_consent`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${buildToken()}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: form,
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	});
	return readJson(res, "create_consent");
}

function _clearNoticeCache() {
	noticeCache.clear();
}

module.exports = { isConfigured, buildToken, getConsentNotices, createConsent, _clearNoticeCache };
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd backend && node --test src/lib/consentPortal.test.js`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/consentPortal.js backend/src/lib/consentPortal.test.js
git commit -m "Add consent portal client for contact form OTP and consent"
```

---

### Task 3: Contact helpers and reCAPTCHA verifier

**Files:**
- Create: `backend/src/lib/contactHelpers.js`, `backend/src/lib/recaptcha.js`
- Test: `backend/src/lib/contactHelpers.test.js`, `backend/src/lib/recaptcha.test.js`

**Interfaces:**
- Produces:
  - `CONTACT_TOPICS: { [value: string]: string /* label */ }` (10 entries from the spec)
  - `deviceTypeFromUserAgent(ua?: string): "Mobile" | "Tablet" | "Desktop"`
  - `clientIp(req): string` — first `X-Forwarded-For` entry, else socket address
  - `isTestAddress(email: string): boolean`
  - `createRateLimiter({ max, windowMs }): (key: string) => boolean` — true = allowed
  - `recaptcha.verifyRecaptcha(token: string, ip?: string): Promise<boolean>` (module object)

- [ ] **Step 1: Write the failing tests**

`backend/src/lib/contactHelpers.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const {
	CONTACT_TOPICS,
	deviceTypeFromUserAgent,
	clientIp,
	isTestAddress,
	createRateLimiter,
} = require("./contactHelpers");

test("has the ten purposes from the old site", () => {
	assert.equal(Object.keys(CONTACT_TOPICS).length, 10);
	assert.equal(CONTACT_TOPICS.dpo_service, "Data Protection Officer as a Service");
});

test("detects device type from the user agent", () => {
	assert.equal(deviceTypeFromUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148"), "Mobile");
	assert.equal(deviceTypeFromUserAgent("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)"), "Tablet");
	assert.equal(deviceTypeFromUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"), "Desktop");
	assert.equal(deviceTypeFromUserAgent(undefined), "Desktop");
});

test("clientIp prefers the first forwarded address", () => {
	const req = { get: name => (name === "x-forwarded-for" ? "5.6.7.8, 10.0.0.1" : undefined), socket: { remoteAddress: "::1" } };
	assert.equal(clientIp(req), "5.6.7.8");
	const direct = { get: () => undefined, socket: { remoteAddress: "::1" } };
	assert.equal(clientIp(direct), "::1");
});

test("flags yopmail and company addresses as test addresses", () => {
	assert.equal(isTestAddress("someone@yopmail.com"), true);
	assert.equal(isTestAddress("Staff@DPDPConsultants.com"), true);
	assert.equal(isTestAddress("client@example.com"), false);
});

test("rate limiter allows max hits per key within the window", () => {
	const allow = createRateLimiter({ max: 2, windowMs: 60_000 });
	assert.equal(allow("a"), true);
	assert.equal(allow("a"), true);
	assert.equal(allow("a"), false);
	assert.equal(allow("b"), true);
});
```

`backend/src/lib/recaptcha.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const recaptcha = require("./recaptcha");

test("passes when no secret is configured", async () => {
	delete process.env.RECAPTCHA_SECRET;
	assert.equal(await recaptcha.verifyRecaptcha("", "1.2.3.4"), true);
});

test("rejects an empty token when a secret is configured", async () => {
	process.env.RECAPTCHA_SECRET = "secret";
	try {
		assert.equal(await recaptcha.verifyRecaptcha("", "1.2.3.4"), false);
	} finally {
		delete process.env.RECAPTCHA_SECRET;
	}
});

test("returns Google's success flag", async () => {
	process.env.RECAPTCHA_SECRET = "secret";
	const originalFetch = global.fetch;
	let sent;
	global.fetch = async (url, init) => {
		sent = { url, body: new URLSearchParams(init.body.toString()) };
		return new Response(JSON.stringify({ success: true }));
	};
	try {
		assert.equal(await recaptcha.verifyRecaptcha("tok", "1.2.3.4"), true);
		assert.equal(sent.url, "https://www.google.com/recaptcha/api/siteverify");
		assert.equal(sent.body.get("secret"), "secret");
		assert.equal(sent.body.get("response"), "tok");
		assert.equal(sent.body.get("remoteip"), "1.2.3.4");

		global.fetch = async () => new Response(JSON.stringify({ success: false }));
		assert.equal(await recaptcha.verifyRecaptcha("tok", "1.2.3.4"), false);

		global.fetch = async () => {
			throw new Error("network down");
		};
		assert.equal(await recaptcha.verifyRecaptcha("tok", "1.2.3.4"), false);
	} finally {
		global.fetch = originalFetch;
		delete process.env.RECAPTCHA_SECRET;
	}
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd backend && node --test src/lib/contactHelpers.test.js src/lib/recaptcha.test.js`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `backend/src/lib/contactHelpers.js`**

```js
const CONTACT_TOPICS = {
	compliance_evaluation: "Compliance Evaluation & Risk Assessment",
	policy_development: "Assist in Policy Development",
	training_education: "Training & Education Programs for DPDPA Compliance",
	data_audit_analysis: "Comprehensive Data Audit & Analysis",
	incident_response: "Incident Response Planning",
	live_demos: "Live Demonstrations of Compliance Tools",
	gap_assessment: "Gap Assessment Review & Remediation Planning",
	dpo_service: "Data Protection Officer as a Service",
	contract_review: "Contract Review & Data Processing Agreements",
	consulting_advisory: "Consulting, Advisory, and Audit",
};

function deviceTypeFromUserAgent(userAgent = "") {
	const ua = String(userAgent || "").toLowerCase();
	if (ua.includes("ipad") || ua.includes("tablet")) return "Tablet";
	if (ua.includes("mobile")) return "Mobile";
	return "Desktop";
}

function clientIp(req) {
	const forwarded = req.get("x-forwarded-for");
	if (forwarded) return forwarded.split(",")[0].trim();
	return req.socket?.remoteAddress || "";
}

// Carried over from the old site: staff test with yopmail or company
// addresses, and those runs shouldn't land in the leads inbox.
function isTestAddress(email) {
	const value = String(email || "").toLowerCase();
	return value.includes("yopmail") || value.includes("dpdpconsultants");
}

function createRateLimiter({ max, windowMs }) {
	const hits = new Map();
	return key => {
		const now = Date.now();
		const recent = (hits.get(key) || []).filter(at => now - at < windowMs);
		if (recent.length >= max) {
			hits.set(key, recent);
			return false;
		}
		recent.push(now);
		hits.set(key, recent);
		return true;
	};
}

module.exports = {
	CONTACT_TOPICS,
	deviceTypeFromUserAgent,
	clientIp,
	isTestAddress,
	createRateLimiter,
};
```

- [ ] **Step 4: Implement `backend/src/lib/recaptcha.js`**

```js
async function verifyRecaptcha(token, ip) {
	if (!process.env.RECAPTCHA_SECRET) {
		console.warn("RECAPTCHA_SECRET not configured, skipping reCAPTCHA check.");
		return true;
	}
	if (!token) return false;

	const form = new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET, response: token });
	if (ip) form.set("remoteip", ip);

	try {
		const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
			method: "POST",
			body: form,
			signal: AbortSignal.timeout(10 * 1000),
		});
		const body = await res.json();
		return body?.success === true;
	} catch (error) {
		console.error("reCAPTCHA verification request failed:", error.message);
		return false;
	}
}

module.exports = { verifyRecaptcha };
```

- [ ] **Step 5: Run to verify they pass**

Run: `cd backend && node --test src/lib/contactHelpers.test.js src/lib/recaptcha.test.js`
Expected: PASS (8 tests).

- [ ] **Step 6: Commit**

```bash
git add backend/src/lib/contactHelpers.js backend/src/lib/contactHelpers.test.js backend/src/lib/recaptcha.js backend/src/lib/recaptcha.test.js
git commit -m "Add contact form helpers and reCAPTCHA verification"
```

---

### Task 4: Contact routes and notification email

**Files:**
- Modify: `backend/src/routes/contact.js` (full rewrite)
- Modify: `backend/src/lib/mailer.js` (`sendContactNotification` only)
- Test: `backend/src/routes/contact.test.js` (full rewrite)

**Interfaces:**
- Consumes: Task 1 Prisma models; Task 2 `consentPortal.isConfigured/getConsentNotices/createConsent`; Task 3 helpers and `recaptcha.verifyRecaptcha`.
- Produces HTTP API (mounted at `/api/contact`, already wired in `app.js`):
  - `GET /config` → `200 { verification: boolean, recaptchaSiteKey: string, notices: { [lang]: html } }`
  - `POST /start` body `{ name, email, phone, topic, message, tracking?: { utm, referrer } }` → `201 { verificationId }` | `201 { done: true }` (verification off) | `400 { message }` | `429 { message }` | `502 { message }`
  - `POST /resend` body `{ verificationId }` → `200 { ok: true }` | `410` | `429` | `502`
  - `POST /verify` body `{ verificationId, otp, language, recaptchaToken }` → `200 { done: true }` | `400 { message, field: "otp" | "recaptcha" }` | `410 { message }` | `429 { message }`
  - `sendContactNotification({ name, email, phone, service, message, language, utm, referrer, device, ip, consentRecorded })`

- [ ] **Step 1: Write the failing tests** (replace `backend/src/routes/contact.test.js`)

```js
const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");

const testDbPath = path.join(__dirname, "../../data/test-contact.db");
process.env.DATABASE_URL = `file:${testDbPath}`;
delete process.env.SMTP_HOST;
delete process.env.SMTP_USER;
delete process.env.RECAPTCHA_SECRET;

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
	const res = await start(buildApp(), freshIp());
	assert.equal(res.status, 502);
	assert.match(res.body.message, /info@dpdpconsultants\.com/);
	assert.equal(await prisma.contactVerification.count(), before);
});

test("start returns 502 when the portal response has no otp", async () => {
	portalOn({ otp: "" });
	const res = await start(buildApp(), freshIp());
	assert.equal(res.status, 502);
});

test("start is limited to 5 requests per IP", async () => {
	portalOn();
	const app = buildApp();
	const ip = freshIp();
	for (let i = 0; i < 5; i += 1) {
		assert.equal((await start(app, ip)).status, 201);
	}
	assert.equal((await start(app, ip)).status, 429);
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
	const { body } = await start(app, freshIp());
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
	const { body } = await start(app, freshIp());
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

test("verify returns 410 for an expired or unknown verification", async () => {
	portalOn();
	const app = buildApp();
	const { body } = await start(app, freshIp());
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
	const { body } = await start(app, freshIp());
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
	const { body } = await start(app, freshIp());

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
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && node --test src/routes/contact.test.js`
Expected: FAIL — 404s on `/config`, `/start`, etc.

- [ ] **Step 3: Rewrite `backend/src/routes/contact.js`**

```js
const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const mailer = require("../lib/mailer");
const consentPortal = require("../lib/consentPortal");
const recaptcha = require("../lib/recaptcha");
const {
	CONTACT_TOPICS,
	deviceTypeFromUserAgent,
	clientIp,
	isTestAddress,
	createRateLimiter,
} = require("../lib/contactHelpers");

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\d{10}$/;

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_WAIT_MS = 30 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const DEFAULT_LANGUAGE = "English";

const PORTAL_DOWN_MESSAGE =
	"We couldn't send a verification code right now. Please try again, or email us at info@dpdpconsultants.com.";
const EXPIRED_MESSAGE = "This verification has expired. Please submit the form again.";

// Every /start and /resend makes the portal email someone, so cap how often
// one IP can trigger that.
const sendLimiter = createRateLimiter({ max: 5, windowMs: 10 * 60 * 1000 });

function department() {
	return process.env.CONSENT_DEPARTMENT || "Contact Us";
}

function text(value) {
	return typeof value === "string" ? value.trim() : "";
}

function readLead(body) {
	const tracking = body.tracking && typeof body.tracking === "object" ? body.tracking : {};
	return {
		name: text(body.name),
		email: text(body.email).toLowerCase(),
		phone: text(body.phone),
		topic: text(body.topic),
		message: text(body.message),
		utm: text(tracking.utm).slice(0, 500),
		referrer: text(tracking.referrer).slice(0, 500),
	};
}

function validateLead(lead) {
	if (!lead.name || !lead.email || !lead.message) return "Name, email and message are required.";
	if (!emailPattern.test(lead.email)) return "Please provide a valid email address.";
	if (!phonePattern.test(lead.phone)) return "Please provide a 10-digit phone number.";
	if (!CONTACT_TOPICS[lead.topic]) return "Please choose the purpose of reaching out.";
	return null;
}

async function requestOtp(lead) {
	const result = await consentPortal.createConsent({
		name: lead.name,
		email: lead.email,
		phone: lead.phone,
		ipaddress: lead.ip,
		department: department(),
		devicetype: lead.device,
		language: DEFAULT_LANGUAGE,
	});
	const otp = result?.otp;
	if (otp === undefined || otp === null || String(otp).trim() === "") {
		throw new Error("Consent portal response did not include an otp");
	}
	return String(otp).trim();
}

async function saveLead(lead, { language, consentRecorded }) {
	if (isTestAddress(lead.email)) {
		console.log(`Skipping save for test address ${lead.email}.`);
		return;
	}

	const topicLabel = CONTACT_TOPICS[lead.topic];
	const data = {
		name: lead.name,
		email: lead.email,
		phone: lead.phone,
		service: topicLabel,
		topic: topicLabel,
		message: lead.message,
		language,
		utm: lead.utm,
		referrer: lead.referrer,
		device: lead.device,
		ip: lead.ip,
		consentRecorded,
	};
	await prisma.contactSubmission.create({ data });

	try {
		await mailer.sendContactNotification(data);
	} catch (error) {
		console.error("Contact notification email failed to send:", error.message);
	}
}

async function findActiveVerification(id) {
	if (typeof id !== "string" || !id) return null;
	const verification = await prisma.contactVerification.findUnique({ where: { id } });
	if (!verification) return null;
	if (verification.expiresAt < new Date()) {
		await prisma.contactVerification.deleteMany({ where: { id } });
		return null;
	}
	return verification;
}

function leadFromVerification(verification) {
	return { ...verification, ...JSON.parse(verification.tracking) };
}

router.get("/config", async (req, res) => {
	const verification = consentPortal.isConfigured();
	let notices = {};
	if (verification) {
		try {
			notices = await consentPortal.getConsentNotices(department());
		} catch (error) {
			console.error("Failed to load consent notices from the portal:", error.message);
		}
	}
	res.json({ verification, recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || "", notices });
});

router.post("/start", async (req, res) => {
	const lead = readLead(req.body || {});
	const error = validateLead(lead);
	if (error) return res.status(400).json({ message: error });

	lead.ip = clientIp(req);
	lead.device = deviceTypeFromUserAgent(req.get("user-agent"));

	if (!sendLimiter(lead.ip)) {
		return res.status(429).json({ message: "Too many attempts. Please wait a few minutes and try again." });
	}

	if (!consentPortal.isConfigured()) {
		console.warn("Consent portal not configured, saving contact submission without OTP verification.");
		await saveLead(lead, { language: "", consentRecorded: false });
		return res.status(201).json({ done: true });
	}

	await prisma.contactVerification.deleteMany({ where: { expiresAt: { lt: new Date() } } });

	let otp;
	try {
		otp = await requestOtp(lead);
	} catch (portalError) {
		console.error("Consent portal failed to send an OTP:", portalError.message);
		return res.status(502).json({ message: PORTAL_DOWN_MESSAGE });
	}

	const verification = await prisma.contactVerification.create({
		data: {
			name: lead.name,
			email: lead.email,
			phone: lead.phone,
			topic: lead.topic,
			message: lead.message,
			tracking: JSON.stringify({ utm: lead.utm, referrer: lead.referrer, device: lead.device, ip: lead.ip }),
			otpHash: await bcrypt.hash(otp, 10),
			expiresAt: new Date(Date.now() + OTP_TTL_MS),
		},
	});

	res.status(201).json({ verificationId: verification.id });
});

router.post("/resend", async (req, res) => {
	const verification = await findActiveVerification(req.body?.verificationId);
	if (!verification) return res.status(410).json({ message: EXPIRED_MESSAGE });

	if (Date.now() - verification.lastSentAt.getTime() < RESEND_WAIT_MS) {
		return res.status(429).json({ message: "Please wait a few seconds before requesting another code." });
	}
	if (!sendLimiter(clientIp(req))) {
		return res.status(429).json({ message: "Too many attempts. Please wait a few minutes and try again." });
	}

	let otp;
	try {
		otp = await requestOtp(leadFromVerification(verification));
	} catch (portalError) {
		console.error("Consent portal failed to resend an OTP:", portalError.message);
		return res.status(502).json({ message: PORTAL_DOWN_MESSAGE });
	}

	await prisma.contactVerification.update({
		where: { id: verification.id },
		data: {
			otpHash: await bcrypt.hash(otp, 10),
			attempts: 0,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() + OTP_TTL_MS),
		},
	});

	res.json({ ok: true });
});

router.post("/verify", async (req, res) => {
	const body = req.body || {};
	const verification = await findActiveVerification(body.verificationId);
	if (!verification) return res.status(410).json({ message: EXPIRED_MESSAGE });

	const tooMany = { message: "Too many incorrect codes. Please submit the form again." };
	if (verification.attempts >= MAX_OTP_ATTEMPTS) {
		await prisma.contactVerification.deleteMany({ where: { id: verification.id } });
		return res.status(429).json(tooMany);
	}

	if (!(await recaptcha.verifyRecaptcha(text(body.recaptchaToken), clientIp(req)))) {
		return res.status(400).json({ message: "Please complete the reCAPTCHA check.", field: "recaptcha" });
	}

	const code = text(body.otp);
	const matches = /^\d{4,8}$/.test(code) && (await bcrypt.compare(code, verification.otpHash));
	if (!matches) {
		const updated = await prisma.contactVerification.update({
			where: { id: verification.id },
			data: { attempts: { increment: 1 } },
		});
		if (updated.attempts >= MAX_OTP_ATTEMPTS) {
			await prisma.contactVerification.deleteMany({ where: { id: verification.id } });
			return res.status(429).json(tooMany);
		}
		return res.status(400).json({ message: "Invalid OTP", field: "otp" });
	}

	// Deleting first claims the verification, so a double-submitted Agree
	// can't save the same lead twice.
	const claimed = await prisma.contactVerification.deleteMany({ where: { id: verification.id } });
	if (claimed.count === 0) return res.status(410).json({ message: EXPIRED_MESSAGE });

	const lead = leadFromVerification(verification);
	const language = text(body.language) || DEFAULT_LANGUAGE;

	let consentRecorded = false;
	try {
		await consentPortal.createConsent({
			name: lead.name,
			email: lead.email,
			phone: lead.phone,
			ipaddress: lead.ip,
			department: department(),
			devicetype: lead.device,
			language,
			otp: code,
		});
		consentRecorded = true;
	} catch (portalError) {
		console.error("Consent portal failed to record consent:", portalError.message);
	}

	await saveLead(lead, { language, consentRecorded });
	res.json({ done: true });
});

module.exports = router;
```

- [ ] **Step 4: Update `sendContactNotification` in `backend/src/lib/mailer.js`**

Replace the function signature and the `subject`/`text` block (transport setup unchanged):

```js
async function sendContactNotification({
	name,
	email,
	phone,
	service,
	message,
	language,
	utm,
	referrer,
	device,
	ip,
	consentRecorded,
}) {
```

```js
		subject: `New contact form submission${service ? ` - ${service}` : ""}`,
		text: [
			`Name: ${name}`,
			`Email: ${email}`,
			phone ? `Phone: ${phone}` : null,
			service ? `Purpose: ${service}` : null,
			language ? `Consent language: ${language}` : null,
			`Consent recorded in portal: ${consentRecorded ? "Yes" : "No"}`,
			"",
			message,
			"",
			"-",
			utm ? `UTM: ${utm}` : null,
			referrer ? `Referrer: ${referrer}` : null,
			device ? `Device: ${device}` : null,
			ip ? `IP: ${ip}` : null,
		]
			.filter(line => line !== null)
			.join("\n"),
```

`backend/src/lib/mailer.test.js` does not assert on the `Service:` label, so it needs no change.

- [ ] **Step 5: Run the backend suite**

Run: `cd backend && npm test`
Expected: all tests PASS, including the 20 in `contact.test.js`.

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/contact.js backend/src/routes/contact.test.js backend/src/lib/mailer.js
git commit -m "Verify contact leads with a portal OTP and record consent before saving"
```

---

### Task 5: Next.js proxy routes, tracking capture, Google Ads tag

**Files:**
- Delete: `src/app/api/contact/route.js`
- Create: `src/libs/contactProxy.js`, `src/app/api/contact/config/route.js`, `src/app/api/contact/start/route.js`, `src/app/api/contact/resend/route.js`, `src/app/api/contact/verify/route.js`
- Create: `src/libs/tracking.js`, `src/components/shared/others/TrackingCapture.js`, `src/components/shared/others/GoogleAdsTag.js`
- Modify: `src/app/layout.js`

**Interfaces:**
- Consumes: Task 4 HTTP API.
- Produces: same-origin routes `GET /api/contact/config`, `POST /api/contact/{start,resend,verify}` with identical bodies/statuses; `readTracking(): { utm?: string, referrer?: string }`; `markContactSubmitted()`, `consumeContactSubmitted(): boolean`; `GOOGLE_ADS_CONVERSION = "AW-16540124026/XOSvCLjTsasZEPqG-c49"`.

- [ ] **Step 1: Create `src/libs/contactProxy.js`**

```js
import { NextResponse } from "next/server";

const backendUrl = () => process.env.BACKEND_URL || "http://localhost:5000";

// Forwards a contact request to the backend, passing along the visitor's IP
// and user agent so the backend can rate-limit and record the device type.
export async function forwardContactRequest(request, path, method = "POST") {
	const headers = { "Content-Type": "application/json" };
	const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
	const ip = forwardedFor || request.headers.get("x-real-ip");
	if (ip) headers["X-Forwarded-For"] = ip;
	const userAgent = request.headers.get("user-agent");
	if (userAgent) headers["User-Agent"] = userAgent;

	let body;
	if (method === "POST") {
		body = JSON.stringify(await request.json().catch(() => ({})));
	}

	try {
		const res = await fetch(`${backendUrl()}/api/contact${path}`, {
			method,
			headers,
			body,
			cache: "no-store",
		});
		const data = await res.json().catch(() => ({}));
		return NextResponse.json(data, { status: res.status });
	} catch (error) {
		console.error(`Failed to reach backend for contact ${path}:`, error.message);
		return NextResponse.json(
			{ message: "Failed to reach the server. Please try again later." },
			{ status: 502 }
		);
	}
}
```

- [ ] **Step 2: Create the four route files and delete the old one**

`src/app/api/contact/config/route.js`:

```js
import { forwardContactRequest } from "@/libs/contactProxy";

export async function GET(request) {
	return forwardContactRequest(request, "/config", "GET");
}
```

`src/app/api/contact/start/route.js`:

```js
import { forwardContactRequest } from "@/libs/contactProxy";

export async function POST(request) {
	return forwardContactRequest(request, "/start");
}
```

`src/app/api/contact/resend/route.js`:

```js
import { forwardContactRequest } from "@/libs/contactProxy";

export async function POST(request) {
	return forwardContactRequest(request, "/resend");
}
```

`src/app/api/contact/verify/route.js`:

```js
import { forwardContactRequest } from "@/libs/contactProxy";

export async function POST(request) {
	return forwardContactRequest(request, "/verify");
}
```

Run: `git rm src/app/api/contact/route.js`

- [ ] **Step 3: Create `src/libs/tracking.js`**

```js
const TRACKING_KEY = "dpdp-contact-tracking";
const SUBMITTED_KEY = "dpdp-contact-submitted";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_id"];

export const GOOGLE_ADS_ID = "AW-16540124026";
export const GOOGLE_ADS_CONVERSION = "AW-16540124026/XOSvCLjTsasZEPqG-c49";

// Remembers how the visitor first arrived this session (UTM params and the
// external referrer). Storage can be unavailable; tracking is best-effort.
export function captureTracking() {
	try {
		if (sessionStorage.getItem(TRACKING_KEY)) return;
		const params = new URLSearchParams(window.location.search);
		const utm = UTM_KEYS.filter(key => params.get(key))
			.map(key => `${key}=${params.get(key)}`)
			.join("&");
		const referrer =
			document.referrer && !document.referrer.startsWith(window.location.origin)
				? document.referrer
				: "";
		sessionStorage.setItem(TRACKING_KEY, JSON.stringify({ utm, referrer }));
	} catch {}
}

export function readTracking() {
	try {
		return JSON.parse(sessionStorage.getItem(TRACKING_KEY)) || {};
	} catch {
		return {};
	}
}

export function markContactSubmitted() {
	try {
		sessionStorage.setItem(SUBMITTED_KEY, "1");
	} catch {}
}

// True once per real submission, so reloading /thank-you or visiting it
// directly doesn't count as another Google Ads conversion.
export function consumeContactSubmitted() {
	try {
		const submitted = sessionStorage.getItem(SUBMITTED_KEY) === "1";
		sessionStorage.removeItem(SUBMITTED_KEY);
		return submitted;
	} catch {
		return false;
	}
}
```

- [ ] **Step 4: Create `src/components/shared/others/TrackingCapture.js`**

```js
"use client";

import { useEffect } from "react";
import { captureTracking } from "@/libs/tracking";

const TrackingCapture = () => {
	useEffect(() => {
		captureTracking();
	}, []);
	return null;
};

export default TrackingCapture;
```

- [ ] **Step 5: Create `src/components/shared/others/GoogleAdsTag.js`**

```js
import Script from "next/script";
import { GOOGLE_ADS_ID } from "@/libs/tracking";

const GoogleAdsTag = () => (
	<>
		<Script
			src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
			strategy="afterInteractive"
		/>
		<Script id="google-ads-gtag" strategy="afterInteractive">
			{`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');`}
		</Script>
	</>
);

export default GoogleAdsTag;
```

- [ ] **Step 6: Mount both in `src/app/layout.js`**

Add imports below the `getSiteSettings` import:

```js
import GoogleAdsTag from "@/components/shared/others/GoogleAdsTag";
import TrackingCapture from "@/components/shared/others/TrackingCapture";
```

Inside `<body>`, directly after `{children}`:

```jsx
				{children}
				<TrackingCapture />
				<GoogleAdsTag />
```

- [ ] **Step 7: Build**

Run: `npx next build`
Expected: "✓ Compiled successfully"; route list includes `/api/contact/config`, `/api/contact/start`, `/api/contact/resend`, `/api/contact/verify`. (The existing "Falling back to default site colors" lines are expected when the backend isn't running.)

- [ ] **Step 8: Commit**

```bash
git add src/libs/contactProxy.js src/app/api/contact src/libs/tracking.js src/components/shared/others/TrackingCapture.js src/components/shared/others/GoogleAdsTag.js src/app/layout.js
git commit -m "Proxy the new contact endpoints and capture UTM/referrer tracking"
```

---

### Task 6: Contact form UI, consent modal, thank-you page

**Files:**
- Create: `src/libs/contactTopics.js`, `src/components/shared/Inputs/Recaptcha.js`, `src/components/sections/contacts/ConsentModal.js`, `src/components/sections/contacts/ContactFormBody.js`, `src/components/sections/contacts/ThankYouPrimary.js`, `src/app/thank-you/page.js`
- Modify: `src/hooks/useContactForm.js` (full rewrite), `src/components/sections/contacts/Contact2.js`, `src/components/sections/contacts/Contact3.js`

**Interfaces:**
- Consumes: Task 5 routes and `readTracking`, `markContactSubmitted`, `consumeContactSubmitted`, `GOOGLE_ADS_CONVERSION`.
- Produces: `useContactForm()` returning `{ formData, step: "form" | "otp", config, isSubmitting, otp, otpError, recaptchaKey, canProceed, resendIn, consentOpen, handleChange, handleTopicChange, handleSubmit, handleOtpChange, setRecaptchaToken, changeDetails, resendCode, openConsent, closeConsent, agree }`; `<ContactFormBody form={...} submitText="..." />`.

- [ ] **Step 1: Create `src/libs/contactTopics.js`**

Values must match `CONTACT_TOPICS` in `backend/src/lib/contactHelpers.js`.

```js
export const CONTACT_TOPIC_OPTIONS = [
	{ value: "", optionName: "Purpose of reaching out *" },
	{ value: "compliance_evaluation", optionName: "Compliance Evaluation & Risk Assessment" },
	{ value: "policy_development", optionName: "Assist in Policy Development" },
	{ value: "training_education", optionName: "Training & Education Programs for DPDPA Compliance" },
	{ value: "data_audit_analysis", optionName: "Comprehensive Data Audit & Analysis" },
	{ value: "incident_response", optionName: "Incident Response Planning" },
	{ value: "live_demos", optionName: "Live Demonstrations of Compliance Tools" },
	{ value: "gap_assessment", optionName: "Gap Assessment Review & Remediation Planning" },
	{ value: "dpo_service", optionName: "Data Protection Officer as a Service" },
	{ value: "contract_review", optionName: "Contract Review & Data Processing Agreements" },
	{ value: "consulting_advisory", optionName: "Consulting, Advisory, and Audit" },
];
```

- [ ] **Step 2: Create `src/components/shared/Inputs/Recaptcha.js`**

```js
"use client";

import { useEffect, useRef } from "react";

let scriptPromise;

function loadRecaptchaScript() {
	if (window.grecaptcha?.render) return Promise.resolve();
	if (!scriptPromise) {
		scriptPromise = new Promise(resolve => {
			window.__onRecaptchaLoad = resolve;
			const script = document.createElement("script");
			script.src = "https://www.google.com/recaptcha/api.js?onload=__onRecaptchaLoad&render=explicit";
			script.async = true;
			script.defer = true;
			document.head.appendChild(script);
		});
	}
	return scriptPromise;
}

// reCAPTCHA v2 checkbox. Remount it (change its React key) to reset it.
const Recaptcha = ({ siteKey, onChange }) => {
	const containerRef = useRef(null);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	useEffect(() => {
		let cancelled = false;
		loadRecaptchaScript().then(() => {
			if (cancelled || !containerRef.current) return;
			window.grecaptcha.render(containerRef.current, {
				sitekey: siteKey,
				callback: token => onChangeRef.current(token),
				"expired-callback": () => onChangeRef.current(""),
				"error-callback": () => onChangeRef.current(""),
			});
		});
		return () => {
			cancelled = true;
		};
	}, [siteKey]);

	return <div ref={containerRef} />;
};

export default Recaptcha;
```

- [ ] **Step 3: Create `src/components/sections/contacts/ConsentModal.js`**

```js
"use client";

import { useEffect, useState } from "react";

const FALLBACK_NOTICE =
	"<p>By clicking Agree, you consent to DPDP Consultants (Privacyium Tech Pvt. Ltd.) processing your name, email address and phone number to respond to your enquiry, in accordance with the Digital Personal Data Protection Act, 2023.</p>";

// Notice HTML comes from the company's own consent portal, rendered as-is
// just like the old site did.
const ConsentModal = ({ open, notices, isSubmitting, onAgree, onClose }) => {
	const languages = Object.keys(notices || {});
	const defaultLanguage = languages.includes("English") ? "English" : languages[0] || "English";
	const [language, setLanguage] = useState(defaultLanguage);

	useEffect(() => {
		if (open) setLanguage(defaultLanguage);
	}, [open, defaultLanguage]);

	if (!open) return null;

	return (
		<div
			className="modal d-block"
			tabIndex="-1"
			role="dialog"
			aria-modal="true"
			aria-labelledby="consent-modal-title"
			style={{ background: "rgba(0, 0, 0, 0.5)" }}
			data-lenis-prevent
		>
			<div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
				<div className="modal-content">
					<div className="modal-header d-flex justify-content-between align-items-center">
						<h5 className="modal-title" id="consent-modal-title">
							Consent Notice
						</h5>
						{languages.length > 1 ? (
							<label className="d-flex align-items-center gap-2 mb-0">
								<span>Language:</span>
								<select
									className="form-select form-select-sm w-auto"
									value={language}
									onChange={e => setLanguage(e.target.value)}
								>
									{languages.map(lang => (
										<option key={lang} value={lang}>
											{lang}
										</option>
									))}
								</select>
							</label>
						) : null}
					</div>
					<div
						className="modal-body"
						dangerouslySetInnerHTML={{ __html: notices?.[language] || FALLBACK_NOTICE }}
					/>
					<div className="modal-footer">
						<button
							type="button"
							className="btn btn-primary"
							disabled={isSubmitting}
							onClick={() => onAgree(language)}
						>
							{isSubmitting ? "Submitting..." : "Agree"}
						</button>
						<button type="button" className="btn btn-secondary" onClick={onClose}>
							Close
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ConsentModal;
```

- [ ] **Step 4: Rewrite `src/hooks/useContactForm.js`**

```js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSweetAlert from "@/hooks/useSweetAlert";
import { markContactSubmitted, readTracking } from "@/libs/tracking";

const initialFormData = {
	name: "",
	email: "",
	phone: "",
	topic: "",
	message: "",
};

const RESEND_WAIT_SECONDS = 30;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function postJson(url, body) {
	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	const data = await res.json().catch(() => ({}));
	return { status: res.status, ok: res.ok, data };
}

const useContactForm = () => {
	const creteAlert = useSweetAlert();
	const router = useRouter();
	const [formData, setFormData] = useState(initialFormData);
	const [config, setConfig] = useState({ verification: false, recaptchaSiteKey: "", notices: {} });
	const [step, setStep] = useState("form");
	const [verificationId, setVerificationId] = useState("");
	const [otp, setOtp] = useState("");
	const [otpError, setOtpError] = useState("");
	const [recaptchaToken, setRecaptchaToken] = useState("");
	const [recaptchaKey, setRecaptchaKey] = useState(0);
	const [consentOpen, setConsentOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [resendIn, setResendIn] = useState(0);

	useEffect(() => {
		fetch("/api/contact/config")
			.then(res => (res.ok ? res.json() : null))
			.then(data => {
				if (data) setConfig(data);
			})
			.catch(() => {});
	}, []);

	useEffect(() => {
		if (resendIn <= 0) return;
		const timer = setTimeout(() => setResendIn(seconds => seconds - 1), 1000);
		return () => clearTimeout(timer);
	}, [resendIn]);

	const recaptchaRequired = Boolean(config.recaptchaSiteKey);
	const canProceed = otp.length === 6 && (!recaptchaRequired || Boolean(recaptchaToken));

	const handleChange = e => {
		const { name } = e.target;
		let { value } = e.target;
		if (name === "phone") value = value.replace(/\D/g, "").slice(0, 10);
		if (name === "email") value = value.toLowerCase();
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleTopicChange = option => {
		setFormData(prev => ({ ...prev, topic: option?.value || "" }));
	};

	const resetRecaptcha = () => {
		setRecaptchaToken("");
		setRecaptchaKey(key => key + 1);
	};

	const backToForm = () => {
		setStep("form");
		setVerificationId("");
		setOtp("");
		setOtpError("");
		setConsentOpen(false);
		resetRecaptcha();
	};

	const finish = () => {
		markContactSubmitted();
		router.push("/thank-you");
	};

	const handleSubmit = async e => {
		e.preventDefault();

		if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
			creteAlert("error", "Please fill in your name, email and message.");
			return;
		}
		if (!emailPattern.test(formData.email.trim())) {
			creteAlert("error", "Please enter a valid email address.");
			return;
		}
		if (formData.phone.length !== 10) {
			creteAlert("error", "Please enter a 10-digit phone number.");
			return;
		}
		if (!formData.topic) {
			creteAlert("error", "Please choose the purpose of reaching out.");
			return;
		}

		setIsSubmitting(true);
		try {
			const { ok, data } = await postJson("/api/contact/start", { ...formData, tracking: readTracking() });
			if (!ok) {
				creteAlert("error", data?.message || "Something went wrong. Please try again.");
				return;
			}
			if (data.done) {
				finish();
				return;
			}
			setVerificationId(data.verificationId);
			setOtp("");
			setOtpError("");
			resetRecaptcha();
			setResendIn(RESEND_WAIT_SECONDS);
			setStep("otp");
		} catch {
			creteAlert("error", "Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleOtpChange = e => {
		setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
		setOtpError("");
	};

	const resendCode = async () => {
		if (resendIn > 0) return;
		const { status, ok, data } = await postJson("/api/contact/resend", { verificationId });
		if (ok) {
			setOtp("");
			setOtpError("");
			setResendIn(RESEND_WAIT_SECONDS);
			creteAlert("success", `A new code has been sent to ${formData.email}.`);
			return;
		}
		creteAlert("error", data?.message || "Couldn't resend the code. Please try again.");
		if (status === 410) backToForm();
	};

	const openConsent = () => {
		if (canProceed) setConsentOpen(true);
	};

	const closeConsent = () => setConsentOpen(false);

	const agree = async language => {
		setIsSubmitting(true);
		try {
			const { status, ok, data } = await postJson("/api/contact/verify", {
				verificationId,
				otp,
				language,
				recaptchaToken,
			});
			if (ok) {
				finish();
				return;
			}
			setConsentOpen(false);
			if (data?.field === "otp") {
				setOtpError(data.message || "Invalid OTP");
				return;
			}
			if (data?.field === "recaptcha") {
				resetRecaptcha();
				creteAlert("error", data.message);
				return;
			}
			creteAlert("error", data?.message || "Something went wrong. Please try again.");
			if (status === 410 || status === 429) backToForm();
		} catch {
			creteAlert("error", "Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return {
		formData,
		step,
		config,
		isSubmitting,
		otp,
		otpError,
		recaptchaKey,
		canProceed,
		resendIn,
		consentOpen,
		handleChange,
		handleTopicChange,
		handleSubmit,
		handleOtpChange,
		setRecaptchaToken,
		changeDetails: backToForm,
		resendCode,
		openConsent,
		closeConsent,
		agree,
	};
};

export default useContactForm;
```

- [ ] **Step 5: Create `src/components/sections/contacts/ContactFormBody.js`**

```js
"use client";

import ButtonPrimary from "@/components/shared/buttons/ButtonPrimary";
import ReactNiceSelect from "@/components/shared/Inputs/ReactNiceSelect";
import Recaptcha from "@/components/shared/Inputs/Recaptcha";
import ConsentModal from "@/components/sections/contacts/ConsentModal";
import { CONTACT_TOPIC_OPTIONS } from "@/libs/contactTopics";

// Fields + OTP step shared by Contact2 and Contact3. `form` is the return
// value of useContactForm().
const ContactFormBody = ({ form, submitText }) => {
	const locked = form.step === "otp";

	return (
		<div className="row">
			<div className="col-sm-6">
				<div className="form-input">
					<input
						type="text"
						name="name"
						placeholder="Full Name *"
						value={form.formData.name}
						onChange={form.handleChange}
						disabled={locked}
					/>
				</div>
			</div>
			<div className="col-sm-6">
				<div className="form-input">
					<input
						type="email"
						name="email"
						placeholder="Email Address *"
						value={form.formData.email}
						onChange={form.handleChange}
						disabled={locked}
					/>
				</div>
			</div>
			<div className="col-sm-6">
				<div className="form-input">
					<input
						type="tel"
						name="phone"
						inputMode="numeric"
						maxLength={10}
						placeholder="Phone number *"
						value={form.formData.phone}
						onChange={form.handleChange}
						disabled={locked}
					/>
				</div>
			</div>
			<div className="col-sm-6">
				<div
					className="form-input"
					style={locked ? { pointerEvents: "none", opacity: 0.6 } : undefined}
				>
					<div className="tj-nice-select-box">
						<div className="tj-select">
							<ReactNiceSelect
								selectedIndex={0}
								getSelectedOption={form.handleTopicChange}
								options={CONTACT_TOPIC_OPTIONS}
							/>
						</div>
					</div>
				</div>
			</div>
			<div className="col-sm-12">
				<div className="form-input message-input">
					<textarea
						name="message"
						placeholder="Type message *"
						value={form.formData.message}
						onChange={form.handleChange}
						disabled={locked}
					></textarea>
				</div>
			</div>

			{locked ? (
				<div className="col-sm-12">
					<p className="mb-2">
						We&apos;ve sent a 6-digit code to <strong>{form.formData.email}</strong>.{" "}
						<button type="button" className="btn btn-link p-0 align-baseline" onClick={form.changeDetails}>
							Change details
						</button>
					</p>
					<div className="form-input">
						<input
							type="text"
							name="otp"
							inputMode="numeric"
							autoComplete="one-time-code"
							maxLength={6}
							placeholder="Enter the OTP sent to your email *"
							value={form.otp}
							onChange={form.handleOtpChange}
							aria-invalid={form.otpError ? "true" : "false"}
							style={form.otpError ? { borderColor: "red" } : undefined}
						/>
						{form.otpError ? (
							<span className="d-block mt-1" style={{ color: "red" }}>
								{form.otpError}
							</span>
						) : null}
					</div>
					<p className="mb-3">
						<button
							type="button"
							className="btn btn-link p-0"
							onClick={form.resendCode}
							disabled={form.resendIn > 0}
						>
							{form.resendIn > 0 ? `Resend code in ${form.resendIn}s` : "Resend code"}
						</button>
					</p>
					{form.config.recaptchaSiteKey ? (
						<div className="mb-3">
							<Recaptcha
								key={form.recaptchaKey}
								siteKey={form.config.recaptchaSiteKey}
								onChange={form.setRecaptchaToken}
							/>
						</div>
					) : null}
				</div>
			) : null}

			<div className="submit-btn">
				{locked ? (
					<ButtonPrimary
						type={"button"}
						text={"Proceed"}
						onClick={form.openConsent}
						disabled={!form.canProceed || form.isSubmitting}
					/>
				) : (
					<ButtonPrimary
						type={"submit"}
						text={form.isSubmitting ? "Sending..." : submitText}
						disabled={form.isSubmitting}
					/>
				)}
			</div>

			<ConsentModal
				open={form.consentOpen}
				notices={form.config.notices}
				isSubmitting={form.isSubmitting}
				onAgree={form.agree}
				onClose={form.closeConsent}
			/>
		</div>
	);
};

export default ContactFormBody;
```

`ButtonPrimary` does not forward `onClick` today. In `src/components/shared/buttons/ButtonPrimary.js`, add `onClick` to the destructured props (after `disabled`) and to the `<button>` element:

```jsx
				<button
					type={type ? type : "submit"}
					disabled={disabled}
					onClick={onClick}
					className={`tj-primary-btn ${className ? className : ""}`}
				>
```

- [ ] **Step 6: Use it in `Contact3.js`**

Replace the imports and hook call at the top:

```js
"use client";
import ContactFormBody from "@/components/sections/contacts/ContactFormBody";
import useContactForm from "@/hooks/useContactForm";

const Contact3 = () => {
	const form = useContactForm();
```

Replace everything from `<form id="contact-form" onSubmit={handleSubmit}>` through its closing `</form>` with:

```jsx
							<form id="contact-form" onSubmit={form.handleSubmit} noValidate>
								<ContactFormBody form={form} submitText={"Submit Now"} />
							</form>
```

- [ ] **Step 7: Use it in `Contact2.js`**

Replace the imports and hook call:

```js
"use client";
import ContactFormBody from "@/components/sections/contacts/ContactFormBody";
import useContactForm from "@/hooks/useContactForm";
import Link from "next/link";

const Contact2 = () => {
	const form = useContactForm();
```

Replace the whole `<form id="contact-form-2" ...>...</form>` block with:

```jsx
							<form id="contact-form-2" onSubmit={form.handleSubmit} noValidate>
								<div className="wow fadeInUp" data-wow-delay=".5s">
									<ContactFormBody form={form} submitText={"Send Message"} />
								</div>
							</form>
```

- [ ] **Step 8: Create `src/components/sections/contacts/ThankYouPrimary.js`**

```js
"use client";

import { useEffect } from "react";
import ButtonPrimary from "@/components/shared/buttons/ButtonPrimary";
import { consumeContactSubmitted, GOOGLE_ADS_CONVERSION } from "@/libs/tracking";

const ThankYouPrimary = () => {
	useEffect(() => {
		if (!consumeContactSubmitted()) return;
		// gtag.js may still be loading; queueing on dataLayer is how gtag
		// itself buffers calls until it's ready.
		window.dataLayer = window.dataLayer || [];
		window.gtag =
			window.gtag ||
			function gtag() {
				window.dataLayer.push(arguments);
			};
		window.gtag("event", "conversion", { send_to: GOOGLE_ADS_CONVERSION });
	}, []);

	return (
		<section className="section-gap">
			<div className="container">
				<div className="row justify-content-center">
					<div className="col-lg-8 text-center">
						<h5 className="mb-3">You matter. We matter.</h5>
						<h2 className="sec-title mb-4">Data Privacy Matters.</h2>
						<p className="mb-5">
							Thank you for contacting DPDP Consultants; Our Privacy Expert will reach out to you shortly.
						</p>
						<ButtonPrimary text={"Back to Home"} url={"/"} />
					</div>
				</div>
			</div>
		</section>
	);
};

export default ThankYouPrimary;
```

- [ ] **Step 9: Create `src/app/thank-you/page.js`**

```js
import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";
import ThankYouPrimary from "@/components/sections/contacts/ThankYouPrimary";
import HeroInner from "@/components/sections/hero/HeroInner";
import BackToTop from "@/components/shared/others/BackToTop";
import HeaderSpace from "@/components/shared/others/HeaderSpace";
import ClientWrapper from "@/components/shared/wrappers/ClientWrapper";

export const metadata = {
	title: "Thank You | DPDP Consultants",
	robots: { index: false },
};

export default function ThankYou() {
	return (
		<div>
			<BackToTop />
			<Header />
			<Header isStickyHeader={true} />
			<div id="smooth-wrapper">
				<div id="smooth-content">
					<main>
						<HeaderSpace />
						<HeroInner title={"Thank You"} text={"Thank You"} />
						<ThankYouPrimary />
					</main>
					<Footer />
				</div>
			</div>
			<ClientWrapper />
		</div>
	);
}
```

- [ ] **Step 10: Build**

Run: `npx next build`
Expected: "✓ Compiled successfully", `/thank-you` in the route list, no errors about `useContactForm` consumers (`grep -rn "handleServiceChange" src` returns nothing).

- [ ] **Step 11: Manual check, verification off**

With `CONSENT_API_BASE` blank in `backend/.env`, run backend (`cd backend && npm run dev`) and site (`npm run dev`). On `/contact`: submitting with an empty purpose shows "Please choose the purpose…"; letters typed into phone are dropped; a full valid submission lands on `/thank-you`; the lead appears in the admin Messages list with its purpose.

- [ ] **Step 12: Commit**

```bash
git add src/libs/contactTopics.js src/components/shared/Inputs/Recaptcha.js src/components/sections/contacts src/hooks/useContactForm.js src/app/thank-you src/components/shared/buttons/ButtonPrimary.js
git commit -m "Add OTP step, consent notice and thank-you page to the contact form"
```

---

### Task 7: Admin message details

**Files:**
- Modify: `admin/src/components/MessageDetailModal.js` (the `<dl className="message-detail-grid">` block)

**Interfaces:**
- Consumes: `ContactSubmission` fields from Task 1 (already returned by `GET /api/admin/messages`, which uses `findMany` with no `select`).

- [ ] **Step 1: Replace the Service entry and add the new ones**

Replace the `<div><dt>Service</dt>...</div>` entry with:

```jsx
						<div>
							<dt>Purpose</dt>
							<dd>{message.topic || message.service || "—"}</dd>
						</div>
						<div>
							<dt>Consent recorded</dt>
							<dd>{message.consentRecorded ? "Yes" : "No"}</dd>
						</div>
						<div>
							<dt>Consent language</dt>
							<dd>{message.language || "—"}</dd>
						</div>
						<div>
							<dt>Device</dt>
							<dd>{message.device || "—"}</dd>
						</div>
						<div>
							<dt>UTM</dt>
							<dd>{message.utm || "—"}</dd>
						</div>
						<div>
							<dt>Referrer</dt>
							<dd>{message.referrer || "—"}</dd>
						</div>
						<div>
							<dt>IP address</dt>
							<dd>{message.ip || "—"}</dd>
						</div>
```

Keep the existing `Received` entry after them.

- [ ] **Step 2: Build the admin app**

Run: `cd admin && npx next build`
Expected: "✓ Compiled successfully".

- [ ] **Step 3: Commit**

```bash
git add admin/src/components/MessageDetailModal.js
git commit -m "Show purpose, consent and tracking details on admin contact messages"
```

---

### Task 8: Interim keys and end-to-end check

**Files:**
- Modify: `backend/.env` (gitignored — never commit, never print secret values to the console)

- [ ] **Step 1: Add interim values to `backend/.env`**

Append (the portal values are the old site's UAT ones from `Desktop/dpdp-WebSite/contact-api-3.php`; the reCAPTCHA pair is Google's published test key pair, which always passes):

```
CONSENT_API_BASE=https://tech.portal-uat.dpdpconsultants.com
CONSENT_JWT_SECRET=<main-portal secret key from contact-api-3.php line 66>
CONSENT_JWT_ISS=https://portal-uat.dpdpconsultants.com
CONSENT_JWT_AUD=https://tech.portal-uat.dpdpconsultants.com
CONSENT_JWT_EMAIL=jaspal.singh@dpdpconsultants.com
CONSENT_DEPARTMENT=Contact Us
RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
RECAPTCHA_SECRET=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
```

Copy the secret value directly from the PHP file into `.env` with a script (e.g. read line 66 and write it) rather than echoing it.

Run: `git status --short backend/.env`
Expected: no output (still ignored).

- [ ] **Step 2: Probe the portal contract**

Restart the backend. Run: `curl -s http://localhost:5000/api/contact/config`
Expected: `"verification":true` and a non-empty `notices` object. If `notices` is `{}`, check the backend log for the portal error and report it — do not change code to guess the format.

- [ ] **Step 3: Full flow in the browser**

On `/contact`, submit with a real inbox you can read (not yopmail/dpdpconsultants, or the lead won't be saved). Expected: OTP email arrives from the portal; entering a wrong code shows "Invalid OTP"; the right code + reCAPTCHA + Agree lands on `/thank-you`; the admin shows the message with "Consent recorded: Yes".

If `/start` returns 502 with a log line "Consent portal response did not include an otp", the UAT portal no longer returns the OTP — stop and report; the spec's core assumption needs revisiting with Jaspal.

- [ ] **Step 4: Final checks**

Run: `cd backend && npm test` → all PASS.
Run: `npx next build` and `cd admin && npx next build` → both compile.
Run: `git grep -n "031950e5\|1f6d7001\|Dpdp@14204"` → no output (no secrets committed).
