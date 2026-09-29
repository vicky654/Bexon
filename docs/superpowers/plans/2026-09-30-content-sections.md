# News, Webinars/Events and Resources Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin-managed News, Webinars/Events and Resources sections with public listing/detail pages, webinar registration and gated PDF downloads running on the existing lead engine.

**Architecture:** One `ContentItem` Prisma model with a `kind` (`news` | `event` | `resource`) and kind-specific nullable fields, validated and normalised by `backend/src/lib/contentItems.js`. A public `/api/content` API (published only, never exposes the stored PDF name) and an admin `/api/admin/content` CRUD. PDFs live in a private directory and are streamed only through `/api/content/resource/:slug/download`, which requires a 15-minute signed token for gated resources. Two new lead types (`webinar`, `resource`) reference a content item; a completed resource lead returns the tokenised download URL. The Next site renders six new pages from server-side fetches; the admin gets a Content section.

**Tech Stack:** Express 5, Prisma 6 (SQLite), multer, jsonwebtoken, `node:test` + supertest; Next.js 16 / React 19 (site and admin).

**Spec:** `docs/superpowers/specs/2026-09-30-content-sections-design.md`

## Global Constraints

- Kinds exactly `news`, `event`, `resource`; unknown kind → 400 `Unknown content type.`
- Event formats `online` "Online", `in_person` "In person". Resource types `whitepaper` "Whitepaper", `guide` "Guide", `checklist` "Checklist", `report` "Report".
- Slug `^[a-z0-9]+(-[a-z0-9]+)*$`, ≤ 120, unique per kind; duplicate → 400 `An item with this slug already exists.`
- Limits: title ≤ 200, summary ≤ 300 (required), venue ≤ 300.
- Public API returns published items only, page size 9, and never includes `fileKey` (resources expose `hasFile`).
- PDFs: `application/pdf` mimetype AND first bytes `%PDF-`, ≤ 20 MB, stored under `backend/private/resources/` (gitignored, never statically served), file key pattern `^[0-9]+-[0-9]+\.pdf$`.
- Download token: HS256, payload `{ purpose: "resource-download", contentId }`, 15 minutes, signed with `DOWNLOAD_TOKEN_SECRET` or, when unset, `JWT_SECRET + ":resource-download"` (never the bare admin `JWT_SECRET`, so a download token can't be replayed as an admin session).
- Expired/invalid token → 403 `This download link has expired. Please request the resource again.`
- Lead types: `webinar` → department `Webinars`; `resource` → department `Whitepapers`; both need name, email, phone, company and a `contentId`. Closed registration → 400 `Registration for this event has closed.`
- Thank-you copy: webinar "You're registered. We'll email you the joining details before the event."; resource "Thank you. Your download should start automatically."
- Times shown to visitors are IST (Asia/Kolkata).
- The download URL is handed to the thank-you page via sessionStorage, never in a page URL.
- Existing lead-engine security unchanged (hashed OTP, atomic attempts, send limiters, test-address rule).
- Code style: tabs, double quotes, semicolons; CommonJS in `backend/`, ES modules in `src/`, `admin/src/`. Never print or modify `backend/.env`. Don't touch the user's servers on ports 4000/5000.

## Review Focus

1. **Guessing a PDF URL** (`/uploads/<anything>.pdf`, `/private/...`, a stolen `fileKey`) → no file is ever reachable except through the token-checked download route. Test in Task 3.
2. **A download token reused for a different resource, or after the resource is unpublished** → 403. Test in Task 3.
3. **A PNG renamed to `.pdf` or sent with `application/pdf`** → rejected by the magic-bytes check. Test in Task 4.
4. **An event whose end time has passed but start time was set without an end** → correctly moves from Upcoming to Past (end missing ⇒ start decides). Test in Task 3.
5. **Registering for an event that has already started, or requesting a non-gated / file-less resource through the lead form** → 400, no portal call. Test in Task 5.

---

## File Map

| File | Responsibility |
|---|---|
| `backend/prisma/schema.prisma` | `ContentItem`; `contentId`/`contentTitle` on lead tables |
| `backend/.gitignore` | ignore `private/` |
| `backend/src/lib/contentItems.js` | kinds, labels, validation, normalisation, public serialisation |
| `backend/src/lib/resourceFiles.js` | private PDF directory, key validation, path/delete helpers |
| `backend/src/lib/downloadTokens.js` | sign/verify download tokens |
| `backend/src/routes/content.js` | public list/detail/download |
| `backend/src/routes/adminContent.js` | admin CRUD |
| `backend/src/routes/upload.js` | + `POST /resource` PDF upload |
| `backend/src/routes/adminAi.js` | + `news` prompt |
| `backend/src/app.js` | mount the two routers |
| `backend/src/lib/leadTypes.js`, `routes/contact.js`, `routes/adminMessages.js`, `lib/mailer.js` | webinar/resource leads |
| `src/libs/contentApi.js`, `src/libs/contentFormat.js` | server fetch helpers, IST formatting, labels |
| `src/app/api/content/resource/[slug]/download/route.js` | download proxy (streams) |
| `src/components/sections/content/*` | cards, listing, pagination, detail, lead form card |
| `src/app/{news,events,resources}/page.js` + `[slug]/page.js` | six pages |
| `src/libs/leadForms.js`, `src/hooks/useContactForm.js`, `ThankYouPrimary.js` | webinar/resource forms, download hand-off |
| `admin/src/app/content/**`, `admin/src/components/ContentForm.js`, `admin/src/lib/navLinks.js`, `admin/src/lib/leadTypes.js`, `MessageDetailModal.js` | admin UI |

---

### Task 1: Schema

**Files:**
- Modify: `backend/prisma/schema.prisma`, `backend/.gitignore`
- Create: generated migration `<timestamp>_add_content_items`

**Interfaces:**
- Produces: `prisma.contentItem` (fields below, compound unique `kind_slug`); `ContactSubmission` and `ContactVerification` gain `contentId Int?`, `contentTitle String?`.

- [ ] **Step 1: Add the model** (after `ContactVerification`):

```prisma
model ContentItem {
  id           Int       @id @default(autoincrement())
  kind         String
  title        String
  slug         String
  summary      String
  body         String    @default("")
  coverImage   String?
  published    Boolean   @default(false)
  publishedAt  DateTime  @default(now())
  sourceUrl    String?
  startsAt     DateTime?
  endsAt       DateTime?
  format       String?
  venue        String?
  recordingUrl String?
  resourceType String?
  fileKey      String?
  gated        Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@unique([kind, slug])
  @@index([kind, published])
}
```
Add to both `ContactSubmission` and `ContactVerification` (after `preferredAt`):
```prisma
  contentId       Int?
  contentTitle    String?
```

- [ ] **Step 2:** Append `private/` to `backend/.gitignore`.

- [ ] **Step 3: Migrate.** `cd backend && npx prisma migrate dev --name add_content_items`. The user's backend holds the engine DLL; an EPERM on copying `query_engine-windows.dll.node` is harmless **only if** `node_modules/.prisma/client/index.js` afterwards contains `contentTitle` (check with grep and report it). Never `migrate reset`.

- [ ] **Step 4:** `cd backend && npm test` → all pass.

- [ ] **Step 5: Commit**
```bash
git add backend/prisma backend/.gitignore
git commit -m "Add ContentItem model and content reference on leads"
```

---

### Task 2: Content validation, files and tokens

**Files:**
- Create: `backend/src/lib/contentItems.js`, `backend/src/lib/resourceFiles.js`, `backend/src/lib/downloadTokens.js`
- Test: `backend/src/lib/contentItems.test.js`, `backend/src/lib/downloadTokens.test.js`

**Interfaces:**
- Produces:
  - `KINDS`, `EVENT_FORMATS`, `RESOURCE_TYPES`, `isKind(kind)`
  - `validateContent(kind, raw): string | null` (raw = request body; dates as strings)
  - `normalizeContent(kind, raw): object` — Prisma `data` (dates → Date/null, fields outside the kind → null, `gated` boolean, `published` boolean)
  - `serializePublic(item)` — item without `fileKey`, plus `hasFile` for resources
  - `resourceFiles`: `RESOURCE_KEY_PATTERN`, `resourceDir()`, `resourcePath(fileKey)` (throws on invalid key), `newResourceKey()`, `deleteResourceFile(fileKey)` (ignores missing); dir = `process.env.RESOURCE_FILES_DIR || backend/private/resources`
  - `downloadTokens`: `signDownloadToken(contentId)`, `verifyDownloadToken(token, contentId): boolean`

- [ ] **Step 1: Write failing tests** — `backend/src/lib/contentItems.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { isKind, validateContent, normalizeContent, serializePublic } = require("./contentItems");

const base = { title: "DPDP Rules notified", slug: "dpdp-rules-notified", summary: "What changed.", body: "<p>Body</p>" };

test("isKind accepts only the three kinds", () => {
	assert.equal(isKind("news"), true);
	assert.equal(isKind("event"), true);
	assert.equal(isKind("resource"), true);
	assert.equal(isKind("blog"), false);
	assert.equal(isKind("constructor"), false);
});

test("unknown kind is rejected", () => {
	assert.equal(validateContent("blog", base), "Unknown content type.");
});

test("shared fields are validated", () => {
	assert.equal(validateContent("news", base), null);
	assert.ok(validateContent("news", { ...base, title: "" }));
	assert.ok(validateContent("news", { ...base, title: "x".repeat(201) }));
	assert.ok(validateContent("news", { ...base, slug: "Bad Slug" }));
	assert.ok(validateContent("news", { ...base, slug: "trailing-" }));
	assert.ok(validateContent("news", { ...base, slug: "a".repeat(121) }));
	assert.ok(validateContent("news", { ...base, summary: "" }));
	assert.ok(validateContent("news", { ...base, summary: "x".repeat(301) }));
	assert.ok(validateContent("news", { ...base, publishedAt: "not a date" }));
	assert.ok(validateContent("news", { ...base, coverImage: "javascript:alert(1)" }));
	assert.equal(validateContent("news", { ...base, coverImage: "/uploads/1-2.png" }), null);
	assert.equal(validateContent("news", { ...base, coverImage: "http://localhost:5000/uploads/1-2.png" }), null);
});

test("news source link must be https", () => {
	assert.ok(validateContent("news", { ...base, sourceUrl: "http://example.com" }));
	assert.equal(validateContent("news", { ...base, sourceUrl: "https://example.com/a" }), null);
});

test("events need a start, a valid format and an end not before the start", () => {
	const event = { ...base, startsAt: "2026-11-01T10:00:00.000Z", format: "online" };
	assert.equal(validateContent("event", event), null);
	assert.equal(validateContent("event", { ...event, startsAt: "" }), "Please set the event start time.");
	assert.equal(validateContent("event", { ...event, format: "hybrid" }), "Please choose the event format.");
	assert.equal(
		validateContent("event", { ...event, endsAt: "2026-11-01T09:00:00.000Z" }),
		"The event can't end before it starts."
	);
	assert.ok(validateContent("event", { ...event, recordingUrl: "ftp://x" }));
	assert.ok(validateContent("event", { ...event, venue: "x".repeat(301) }));
});

test("resources need a type and a file before publishing", () => {
	const resource = { ...base, resourceType: "whitepaper" };
	assert.equal(validateContent("resource", resource), null);
	assert.equal(validateContent("resource", { ...resource, resourceType: "ebook" }), "Please choose the resource type.");
	assert.equal(
		validateContent("resource", { ...resource, published: true }),
		"Upload the PDF before publishing this resource."
	);
	assert.equal(validateContent("resource", { ...resource, published: true, fileKey: "1-2.pdf" }), null);
	assert.ok(validateContent("resource", { ...resource, fileKey: "../../.env" }));
});

test("normalizeContent keeps only the kind's fields", () => {
	const news = normalizeContent("news", { ...base, startsAt: "2026-11-01T10:00:00.000Z", resourceType: "guide", published: true });
	assert.equal(news.startsAt, null);
	assert.equal(news.resourceType, null);
	assert.equal(news.published, true);
	assert.ok(news.publishedAt instanceof Date);

	const event = normalizeContent("event", { ...base, startsAt: "2026-11-01T10:00:00.000Z", format: "online", endsAt: "" });
	assert.ok(event.startsAt instanceof Date);
	assert.equal(event.endsAt, null);
	assert.equal(event.gated, false);

	const resource = normalizeContent("resource", { ...base, resourceType: "guide", gated: false, fileKey: "1-2.pdf" });
	assert.equal(resource.gated, false);
	assert.equal(resource.fileKey, "1-2.pdf");
	assert.equal(normalizeContent("resource", { ...base, resourceType: "guide" }).gated, true);
});

test("serializePublic hides the stored file name", () => {
	const item = { id: 1, kind: "resource", title: "T", fileKey: "1-2.pdf", gated: true };
	const out = serializePublic(item);
	assert.equal(out.fileKey, undefined);
	assert.equal(out.hasFile, true);
	assert.equal(serializePublic({ ...item, fileKey: null }).hasFile, false);
});
```

`backend/src/lib/downloadTokens.test.js`:
```js
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "admin-secret-for-tests";
delete process.env.DOWNLOAD_TOKEN_SECRET;
const { signDownloadToken, verifyDownloadToken } = require("./downloadTokens");

test("a fresh token verifies for its own resource only", () => {
	const token = signDownloadToken(7);
	assert.equal(verifyDownloadToken(token, 7), true);
	assert.equal(verifyDownloadToken(token, 8), false);
});

test("tampered, expired, wrong-purpose and missing tokens fail", () => {
	const token = signDownloadToken(7);
	assert.equal(verifyDownloadToken(`${token}x`, 7), false);
	assert.equal(verifyDownloadToken("", 7), false);
	assert.equal(verifyDownloadToken(undefined, 7), false);

	const secret = "admin-secret-for-tests:resource-download";
	const expired = jwt.sign({ purpose: "resource-download", contentId: 7, exp: Math.floor(Date.now() / 1000) - 10 }, secret);
	assert.equal(verifyDownloadToken(expired, 7), false);
	const wrongPurpose = jwt.sign({ purpose: "admin", contentId: 7 }, secret, { expiresIn: 60 });
	assert.equal(verifyDownloadToken(wrongPurpose, 7), false);
});

test("tokens are not signed with the bare admin secret", () => {
	const token = signDownloadToken(7);
	assert.throws(() => jwt.verify(token, "admin-secret-for-tests"));
});

test("token lifetime is 15 minutes", () => {
	const { exp, iat } = jwt.decode(signDownloadToken(7));
	assert.equal(exp - iat, 15 * 60);
});
```

- [ ] **Step 2:** `cd backend && node --test src/lib/contentItems.test.js src/lib/downloadTokens.test.js` → FAIL (modules missing).

- [ ] **Step 3: Implement `backend/src/lib/contentItems.js`**

```js
const { RESOURCE_KEY_PATTERN } = require("./resourceFiles");

const KINDS = ["news", "event", "resource"];
const EVENT_FORMATS = { online: "Online", in_person: "In person" };
const RESOURCE_TYPES = { whitepaper: "Whitepaper", guide: "Guide", checklist: "Checklist", report: "Report" };
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const KIND_FIELDS = {
	news: ["sourceUrl"],
	event: ["startsAt", "endsAt", "format", "venue", "recordingUrl"],
	resource: ["resourceType", "fileKey", "gated"],
};
const ALL_KIND_FIELDS = [...new Set(Object.values(KIND_FIELDS).flat())];

function isKind(kind) {
	return typeof kind === "string" && KINDS.includes(kind);
}

function text(value) {
	return typeof value === "string" ? value.trim() : "";
}

function isUrl(value, protocols) {
	try {
		return protocols.includes(new URL(value).protocol);
	} catch {
		return false;
	}
}

// undefined = not given, null = invalid, Date = valid
function parseDate(value) {
	const raw = text(value);
	if (!raw) return undefined;
	const date = new Date(raw);
	return Number.isNaN(date.getTime()) ? null : date;
}

function validateContent(kind, raw) {
	if (!isKind(kind)) return "Unknown content type.";
	const title = text(raw.title);
	const slug = text(raw.slug);
	const summary = text(raw.summary);
	const coverImage = text(raw.coverImage);

	if (!title) return "Please enter a title.";
	if (title.length > 200) return "Please keep the title under 200 characters.";
	if (!SLUG_PATTERN.test(slug) || slug.length > 120) {
		return "The slug may only use lowercase letters, numbers and single hyphens (max 120).";
	}
	if (!summary) return "Please enter a summary.";
	if (summary.length > 300) return "Please keep the summary under 300 characters.";
	if (coverImage && !coverImage.startsWith("/uploads/") && !isUrl(coverImage, ["https:", "http:"])) {
		return "The cover image must be an uploaded image or a web address.";
	}
	if (parseDate(raw.publishedAt) === null) return "Please provide a valid publish date.";

	if (kind === "news") {
		if (text(raw.sourceUrl) && !isUrl(text(raw.sourceUrl), ["https:"])) return "The source link must start with https://.";
	}

	if (kind === "event") {
		const startsAt = parseDate(raw.startsAt);
		const endsAt = parseDate(raw.endsAt);
		if (!startsAt) return "Please set the event start time.";
		if (endsAt === null) return "Please provide a valid end time.";
		if (endsAt && endsAt < startsAt) return "The event can't end before it starts.";
		if (!Object.hasOwn(EVENT_FORMATS, text(raw.format))) return "Please choose the event format.";
		if (text(raw.venue).length > 300) return "Please keep the venue under 300 characters.";
		if (text(raw.recordingUrl) && !isUrl(text(raw.recordingUrl), ["https:"])) {
			return "The recording link must start with https://.";
		}
	}

	if (kind === "resource") {
		const fileKey = text(raw.fileKey);
		if (!Object.hasOwn(RESOURCE_TYPES, text(raw.resourceType))) return "Please choose the resource type.";
		if (fileKey && !RESOURCE_KEY_PATTERN.test(fileKey)) return "Invalid file reference.";
		if (raw.published === true && !fileKey) return "Upload the PDF before publishing this resource.";
	}

	return null;
}

function normalizeContent(kind, raw) {
	const data = {
		kind,
		title: text(raw.title),
		slug: text(raw.slug),
		summary: text(raw.summary),
		body: typeof raw.body === "string" ? raw.body : "",
		coverImage: text(raw.coverImage) || null,
		published: raw.published === true,
		publishedAt: parseDate(raw.publishedAt) || new Date(),
		sourceUrl: text(raw.sourceUrl) || null,
		startsAt: parseDate(raw.startsAt) || null,
		endsAt: parseDate(raw.endsAt) || null,
		format: text(raw.format) || null,
		venue: text(raw.venue) || null,
		recordingUrl: text(raw.recordingUrl) || null,
		resourceType: text(raw.resourceType) || null,
		fileKey: text(raw.fileKey) || null,
		gated: raw.gated !== false,
	};
	for (const field of ALL_KIND_FIELDS) {
		if (!KIND_FIELDS[kind].includes(field)) data[field] = field === "gated" ? false : null;
	}
	return data;
}

function serializePublic(item) {
	const { fileKey, ...rest } = item;
	return item.kind === "resource" ? { ...rest, hasFile: Boolean(fileKey) } : rest;
}

module.exports = { KINDS, EVENT_FORMATS, RESOURCE_TYPES, isKind, validateContent, normalizeContent, serializePublic };
```

- [ ] **Step 4: Implement `backend/src/lib/resourceFiles.js`**

```js
const fs = require("fs");
const path = require("path");

const RESOURCE_KEY_PATTERN = /^[0-9]+-[0-9]+\.pdf$/;

function resourceDir() {
	const dir = process.env.RESOURCE_FILES_DIR || path.join(__dirname, "../../private/resources");
	fs.mkdirSync(dir, { recursive: true });
	return dir;
}

function resourcePath(fileKey) {
	if (typeof fileKey !== "string" || !RESOURCE_KEY_PATTERN.test(fileKey)) {
		throw new Error("Invalid resource file key");
	}
	return path.join(resourceDir(), fileKey);
}

function newResourceKey() {
	return `${Date.now()}-${Math.floor(Math.random() * 1e9)}.pdf`;
}

function deleteResourceFile(fileKey) {
	if (!fileKey) return;
	try {
		fs.unlinkSync(resourcePath(fileKey));
	} catch (error) {
		if (error.code !== "ENOENT") console.error("Failed to delete resource file:", error.message);
	}
}

module.exports = { RESOURCE_KEY_PATTERN, resourceDir, resourcePath, newResourceKey, deleteResourceFile };
```

- [ ] **Step 5: Implement `backend/src/lib/downloadTokens.js`**

```js
const jwt = require("jsonwebtoken");

const PURPOSE = "resource-download";
const TTL_SECONDS = 15 * 60;

// Derived from, but never equal to, the admin JWT secret so a download token
// can't be replayed as an admin session cookie.
function secret() {
	return process.env.DOWNLOAD_TOKEN_SECRET || `${process.env.JWT_SECRET}:${PURPOSE}`;
}

function signDownloadToken(contentId) {
	return jwt.sign({ purpose: PURPOSE, contentId }, secret(), { algorithm: "HS256", expiresIn: TTL_SECONDS });
}

function verifyDownloadToken(token, contentId) {
	if (typeof token !== "string" || !token) return false;
	try {
		const payload = jwt.verify(token, secret(), { algorithms: ["HS256"] });
		return payload.purpose === PURPOSE && payload.contentId === contentId;
	} catch {
		return false;
	}
}

module.exports = { signDownloadToken, verifyDownloadToken };
```

- [ ] **Step 6:** Run the two test files → PASS. Then `npm test` → all pass.

- [ ] **Step 7: Commit**
```bash
git add backend/src/lib/contentItems.js backend/src/lib/contentItems.test.js backend/src/lib/resourceFiles.js backend/src/lib/downloadTokens.js backend/src/lib/downloadTokens.test.js
git commit -m "Add content validation, private resource files and download tokens"
```

---

### Task 3: Public content API

**Files:**
- Create: `backend/src/routes/content.js`, `backend/src/routes/content.test.js`
- Modify: `backend/src/app.js` (mount `app.use("/api/content", contentRouter)`)

**Interfaces:**
- Consumes: Task 1 model; Task 2 `isKind`, `RESOURCE_TYPES`, `serializePublic`, `resourcePath`, `verifyDownloadToken`, `signDownloadToken`.
- Produces: `GET /api/content?kind=&page=&resourceType=&when=`, `GET /api/content/:kind/:slug`, `GET /api/content/resource/:slug/download?token=`.

- [ ] **Step 1: Write failing tests** (`backend/src/routes/content.test.js`). Setup mirrors `contact.test.js`: own DB `data/test-content.db`, `prisma db push`, `RESOURCE_FILES_DIR` set to a fresh temp dir (`fs.mkdtempSync(path.join(os.tmpdir(), "dpdp-res-"))`), `JWT_SECRET = "test-secret"`, `DOWNLOAD_TOKEN_SECRET` deleted, and a `buildApp()` mounting the router at `/api/content`.

```js
const DAY = 24 * 60 * 60 * 1000;
const days = n => new Date(Date.now() + n * DAY);

async function make(data) {
	return prisma.contentItem.create({
		data: { title: "T", summary: "S", published: true, ...data },
	});
}

test.beforeEach(async () => {
	await prisma.contentItem.deleteMany();
});

test("unknown kind is rejected", async () => {
	const res = await request(buildApp()).get("/api/content?kind=blog");
	assert.equal(res.status, 400);
	assert.equal(res.body.message, "Unknown content type.");
});

test("lists only published items of the kind, newest first, paginated by 9", async () => {
	for (let i = 0; i < 11; i += 1) await make({ kind: "news", slug: `n-${i}`, publishedAt: days(-i) });
	await make({ kind: "news", slug: "draft", published: false });
	await make({ kind: "resource", slug: "r-1", resourceType: "guide" });

	const first = await request(buildApp()).get("/api/content?kind=news");
	assert.equal(first.body.total, 11);
	assert.equal(first.body.pageSize, 9);
	assert.equal(first.body.items.length, 9);
	assert.equal(first.body.items[0].slug, "n-0");

	const second = await request(buildApp()).get("/api/content?kind=news&page=2");
	assert.equal(second.body.items.length, 2);
	assert.equal(second.body.page, 2);

	const garbage = await request(buildApp()).get("/api/content?kind=news&page=-4");
	assert.equal(garbage.body.page, 1);
});

test("resources filter by type and never expose the file name", async () => {
	await make({ kind: "resource", slug: "g", resourceType: "guide", fileKey: "1-1.pdf" });
	await make({ kind: "resource", slug: "w", resourceType: "whitepaper" });
	const res = await request(buildApp()).get("/api/content?kind=resource&resourceType=guide");
	assert.equal(res.body.items.length, 1);
	assert.equal(res.body.items[0].fileKey, undefined);
	assert.equal(res.body.items[0].hasFile, true);
	assert.equal(JSON.stringify(res.body).includes("1-1.pdf"), false);
});

test("events split into upcoming (soonest first) and past (latest first)", async () => {
	await make({ kind: "event", slug: "next-week", startsAt: days(7), format: "online" });
	await make({ kind: "event", slug: "tomorrow", startsAt: days(1), format: "online" });
	await make({ kind: "event", slug: "running", startsAt: days(-1), endsAt: days(1), format: "online" });
	await make({ kind: "event", slug: "last-month", startsAt: days(-30), format: "online" });
	await make({ kind: "event", slug: "yesterday-no-end", startsAt: days(-1), format: "online" });

	const upcoming = await request(buildApp()).get("/api/content?kind=event");
	assert.deepEqual(upcoming.body.items.map(i => i.slug), ["running", "tomorrow", "next-week"]);

	const past = await request(buildApp()).get("/api/content?kind=event&when=past");
	assert.deepEqual(past.body.items.map(i => i.slug), ["yesterday-no-end", "last-month"]);
});

test("detail returns published items and 404s drafts and unknown slugs", async () => {
	await make({ kind: "news", slug: "live" });
	await make({ kind: "news", slug: "hidden", published: false });
	assert.equal((await request(buildApp()).get("/api/content/news/live")).status, 200);
	assert.equal((await request(buildApp()).get("/api/content/news/hidden")).status, 404);
	assert.equal((await request(buildApp()).get("/api/content/event/live")).status, 404);
	assert.equal((await request(buildApp()).get("/api/content/blog/live")).status, 400);
});

function writePdf(fileKey) {
	fs.writeFileSync(path.join(process.env.RESOURCE_FILES_DIR, fileKey), "%PDF-1.4\n%test\n");
}

test("ungated resources download without a token", async () => {
	writePdf("10-1.pdf");
	await make({ kind: "resource", slug: "open", resourceType: "guide", fileKey: "10-1.pdf", gated: false });
	const res = await request(buildApp()).get("/api/content/resource/open/download");
	assert.equal(res.status, 200);
	assert.match(res.headers["content-type"], /application\/pdf/);
	assert.match(res.headers["content-disposition"], /attachment; filename="open\.pdf"/);
	assert.match(res.headers["cache-control"], /no-store/);
});

test("gated resources need a valid token for that resource", async () => {
	writePdf("10-2.pdf");
	writePdf("10-3.pdf");
	const a = await make({ kind: "resource", slug: "gated-a", resourceType: "guide", fileKey: "10-2.pdf" });
	const b = await make({ kind: "resource", slug: "gated-b", resourceType: "guide", fileKey: "10-3.pdf" });
	const app = buildApp();
	const message = "This download link has expired. Please request the resource again.";

	const none = await request(app).get("/api/content/resource/gated-a/download");
	assert.equal(none.status, 403);
	assert.equal(none.body.message, message);

	const wrong = await request(app).get(`/api/content/resource/gated-a/download?token=${signDownloadToken(b.id)}`);
	assert.equal(wrong.status, 403);

	const ok = await request(app).get(`/api/content/resource/gated-a/download?token=${signDownloadToken(a.id)}`);
	assert.equal(ok.status, 200);

	await prisma.contentItem.update({ where: { id: a.id }, data: { published: false } });
	const unpublished = await request(app).get(`/api/content/resource/gated-a/download?token=${signDownloadToken(a.id)}`);
	assert.equal(unpublished.status, 404);
});

test("a missing file gives a clear 404", async () => {
	await make({ kind: "resource", slug: "gone", resourceType: "guide", fileKey: "99-9.pdf", gated: false });
	const res = await request(buildApp()).get("/api/content/resource/gone/download");
	assert.equal(res.status, 404);
	assert.equal(res.body.message, "This file is no longer available.");
});

test("stored PDFs are not reachable any other way", async () => {
	writePdf("10-4.pdf");
	const app = require("../app")();
	assert.equal((await request(app).get("/uploads/10-4.pdf")).status, 404);
	assert.equal((await request(app).get("/private/resources/10-4.pdf")).status, 404);
});
```
(Require `os`, `signDownloadToken` from `../lib/downloadTokens`. `require("../app")` returns the `buildApp` function — check its export and adapt the call.)

- [ ] **Step 2:** `node --test src/routes/content.test.js` → FAIL.

- [ ] **Step 3: Implement `backend/src/routes/content.js`**

```js
const express = require("express");
const fs = require("fs");
const prisma = require("../lib/prisma");
const { isKind, RESOURCE_TYPES, serializePublic } = require("../lib/contentItems");
const { resourcePath } = require("../lib/resourceFiles");
const { verifyDownloadToken } = require("../lib/downloadTokens");

const router = express.Router();
const PAGE_SIZE = 9;
const EXPIRED_MESSAGE = "This download link has expired. Please request the resource again.";

function eventWindow(when, now) {
	const upcoming = { OR: [{ endsAt: { gte: now } }, { endsAt: null, startsAt: { gte: now } }] };
	const past = { OR: [{ endsAt: { lt: now } }, { endsAt: null, startsAt: { lt: now } }] };
	return when === "past"
		? { where: past, orderBy: { startsAt: "desc" } }
		: { where: upcoming, orderBy: { startsAt: "asc" } };
}

router.get("/", async (req, res) => {
	const { kind } = req.query;
	if (!isKind(kind)) return res.status(400).json({ message: "Unknown content type." });

	const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
	let where = { kind, published: true };
	let orderBy = { publishedAt: "desc" };

	if (kind === "resource" && Object.hasOwn(RESOURCE_TYPES, req.query.resourceType || "")) {
		where.resourceType = req.query.resourceType;
	}
	if (kind === "event") {
		const window = eventWindow(req.query.when, new Date());
		where = { ...where, ...window.where };
		orderBy = window.orderBy;
	}

	const [total, items] = await Promise.all([
		prisma.contentItem.count({ where }),
		prisma.contentItem.findMany({ where, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
	]);
	res.json({ items: items.map(serializePublic), total, page, pageSize: PAGE_SIZE });
});

router.get("/resource/:slug/download", async (req, res) => {
	const item = await prisma.contentItem.findUnique({
		where: { kind_slug: { kind: "resource", slug: req.params.slug } },
	});
	if (!item || !item.published) return res.status(404).json({ message: "Resource not found." });
	if (item.gated && !verifyDownloadToken(req.query.token, item.id)) {
		return res.status(403).json({ message: EXPIRED_MESSAGE });
	}

	let filePath;
	try {
		filePath = resourcePath(item.fileKey);
	} catch {
		filePath = null;
	}
	if (!filePath || !fs.existsSync(filePath)) {
		console.error(`Resource file missing for ${item.slug}: ${item.fileKey}`);
		return res.status(404).json({ message: "This file is no longer available." });
	}

	res.setHeader("Cache-Control", "private, no-store");
	res.download(filePath, `${item.slug}.pdf`, { headers: { "Content-Type": "application/pdf" } });
});

router.get("/:kind/:slug", async (req, res) => {
	const { kind, slug } = req.params;
	if (!isKind(kind)) return res.status(400).json({ message: "Unknown content type." });
	const item = await prisma.contentItem.findUnique({ where: { kind_slug: { kind, slug } } });
	if (!item || !item.published) return res.status(404).json({ message: "Not found." });
	res.json({ item: serializePublic(item) });
});

module.exports = router;
```

- [ ] **Step 4:** Mount in `backend/src/app.js`: `const contentRouter = require("./routes/content");` and `app.use("/api/content", contentRouter);` next to the blogs router.

- [ ] **Step 5:** Run the file, then `npm test` → PASS.

- [ ] **Step 6: Commit**
```bash
git add backend/src/routes/content.js backend/src/routes/content.test.js backend/src/app.js
git commit -m "Add public content API with token-checked resource downloads"
```

---

### Task 4: Admin content API, PDF upload, news AI prompt

**Files:**
- Create: `backend/src/routes/adminContent.js`, `backend/src/routes/adminContent.test.js`
- Modify: `backend/src/routes/upload.js` (+ `POST /resource`), `backend/src/routes/adminAi.js` (+ `news` prompt), `backend/src/app.js` (mount `/api/admin/content`)
- Test: extend `backend/src/routes/adminAi.test.js` only if its unknown-type message assertion changes; add upload tests to `adminContent.test.js`

**Interfaces:**
- Consumes: Task 2 helpers.
- Produces: `GET/POST /api/admin/content`, `GET/PUT/DELETE /api/admin/content/:id` (`{ item }` / `{ items }`, full records incl. `fileKey`); `POST /api/admin/upload/resource` (field `file`) → `{ fileKey }`; AI `type: "news"` → `{ result: { title, excerpt, content } }`.

- [ ] **Step 1: Write failing tests** (`adminContent.test.js`; own DB `data/test-admin-content.db`, temp `RESOURCE_FILES_DIR`, `JWT_SECRET = "test-secret"`, cookie via `signAdminToken`/`COOKIE_NAME` as in `adminMessages.test.js`; app mounts `adminContent` at `/api/admin/content` and `upload` at `/api/admin/upload`):

```js
const newsBody = { kind: "news", title: "Rules notified", slug: "rules-notified", summary: "Summary", published: true };

test("requires admin auth", async () => {
	assert.equal((await request(buildApp()).get("/api/admin/content")).status, 401);
	assert.equal((await request(buildApp()).post("/api/admin/upload/resource")).status, 401);
});

test("creates, lists by kind, updates and deletes", async () => {
	const app = buildApp();
	const created = await request(app).post("/api/admin/content").set("Cookie", authCookie()).send(newsBody);
	assert.equal(created.status, 201);
	const id = created.body.item.id;

	const list = await request(app).get("/api/admin/content?kind=news").set("Cookie", authCookie());
	assert.equal(list.body.items.length, 1);
	const events = await request(app).get("/api/admin/content?kind=event").set("Cookie", authCookie());
	assert.equal(events.body.items.length, 0);

	const updated = await request(app)
		.put(`/api/admin/content/${id}`)
		.set("Cookie", authCookie())
		.send({ ...newsBody, title: "Rules notified (updated)" });
	assert.equal(updated.body.item.title, "Rules notified (updated)");

	assert.equal((await request(app).delete(`/api/admin/content/${id}`).set("Cookie", authCookie())).status, 200);
	assert.equal((await request(app).get(`/api/admin/content/${id}`).set("Cookie", authCookie())).status, 404);
});

test("rejects invalid content and duplicate slugs within a kind", async () => {
	const app = buildApp();
	const bad = await request(app).post("/api/admin/content").set("Cookie", authCookie()).send({ ...newsBody, kind: "blog" });
	assert.equal(bad.status, 400);
	await request(app).post("/api/admin/content").set("Cookie", authCookie()).send({ ...newsBody, slug: "dup" });
	const dup = await request(app).post("/api/admin/content").set("Cookie", authCookie()).send({ ...newsBody, slug: "dup" });
	assert.equal(dup.status, 400);
	assert.equal(dup.body.message, "An item with this slug already exists.");
	const otherKind = await request(app)
		.post("/api/admin/content")
		.set("Cookie", authCookie())
		.send({ kind: "resource", title: "T", slug: "dup", summary: "S", resourceType: "guide" });
	assert.equal(otherKind.status, 201);
});

test("PDF upload accepts real PDFs only", async () => {
	const app = buildApp();
	const pdf = await request(app)
		.post("/api/admin/upload/resource")
		.set("Cookie", authCookie())
		.attach("file", Buffer.from("%PDF-1.7\n%test\n"), { filename: "guide.pdf", contentType: "application/pdf" });
	assert.equal(pdf.status, 201);
	assert.match(pdf.body.fileKey, /^[0-9]+-[0-9]+\.pdf$/);
	assert.ok(fs.existsSync(path.join(process.env.RESOURCE_FILES_DIR, pdf.body.fileKey)));

	const fakePng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	const renamed = await request(app)
		.post("/api/admin/upload/resource")
		.set("Cookie", authCookie())
		.attach("file", fakePng, { filename: "guide.pdf", contentType: "application/pdf" });
	assert.equal(renamed.status, 400);

	const wrongType = await request(app)
		.post("/api/admin/upload/resource")
		.set("Cookie", authCookie())
		.attach("file", Buffer.from("%PDF-1.7"), { filename: "x.txt", contentType: "text/plain" });
	assert.equal(wrongType.status, 400);
});

test("deleting a resource deletes its file; replacing the file deletes the old one", async () => {
	const app = buildApp();
	const upload = async () =>
		(
			await request(app)
				.post("/api/admin/upload/resource")
				.set("Cookie", authCookie())
				.attach("file", Buffer.from("%PDF-1.7\n"), { filename: "a.pdf", contentType: "application/pdf" })
		).body.fileKey;
	const first = await upload();
	const created = await request(app)
		.post("/api/admin/content")
		.set("Cookie", authCookie())
		.send({ kind: "resource", title: "Guide", slug: "guide", summary: "S", resourceType: "guide", fileKey: first, published: true });
	const second = await upload();
	await request(app)
		.put(`/api/admin/content/${created.body.item.id}`)
		.set("Cookie", authCookie())
		.send({ ...created.body.item, fileKey: second });
	assert.equal(fs.existsSync(path.join(process.env.RESOURCE_FILES_DIR, first)), false);

	await request(app).delete(`/api/admin/content/${created.body.item.id}`).set("Cookie", authCookie());
	assert.equal(fs.existsSync(path.join(process.env.RESOURCE_FILES_DIR, second)), false);
});
```

- [ ] **Step 2:** Run → FAIL.

- [ ] **Step 3: Implement `backend/src/routes/adminContent.js`**

```js
const express = require("express");
const prisma = require("../lib/prisma");
const requireAdmin = require("../middleware/requireAdmin");
const { isKind, validateContent, normalizeContent } = require("../lib/contentItems");
const { deleteResourceFile } = require("../lib/resourceFiles");

const router = express.Router();
router.use(requireAdmin);

const DUPLICATE_MESSAGE = "An item with this slug already exists.";

async function findItem(id) {
	const numericId = Number(id);
	if (!Number.isInteger(numericId)) return null;
	return prisma.contentItem.findUnique({ where: { id: numericId } });
}

router.get("/", async (req, res) => {
	const where = isKind(req.query.kind) ? { kind: req.query.kind } : {};
	const items = await prisma.contentItem.findMany({ where, orderBy: { updatedAt: "desc" } });
	res.json({ items });
});

router.get("/:id", async (req, res) => {
	const item = await findItem(req.params.id);
	if (!item) return res.status(404).json({ message: "Item not found." });
	res.json({ item });
});

router.post("/", async (req, res) => {
	const body = req.body || {};
	const error = validateContent(body.kind, body);
	if (error) return res.status(400).json({ message: error });
	const data = normalizeContent(body.kind, body);

	const clash = await prisma.contentItem.findUnique({ where: { kind_slug: { kind: data.kind, slug: data.slug } } });
	if (clash) return res.status(400).json({ message: DUPLICATE_MESSAGE });

	const item = await prisma.contentItem.create({ data });
	res.status(201).json({ item });
});

router.put("/:id", async (req, res) => {
	const existing = await findItem(req.params.id);
	if (!existing) return res.status(404).json({ message: "Item not found." });

	// The kind of an existing item never changes.
	const body = { ...(req.body || {}), kind: existing.kind };
	const error = validateContent(existing.kind, body);
	if (error) return res.status(400).json({ message: error });
	const data = normalizeContent(existing.kind, body);

	const clash = await prisma.contentItem.findUnique({ where: { kind_slug: { kind: data.kind, slug: data.slug } } });
	if (clash && clash.id !== existing.id) return res.status(400).json({ message: DUPLICATE_MESSAGE });

	const item = await prisma.contentItem.update({ where: { id: existing.id }, data });
	if (existing.fileKey && existing.fileKey !== item.fileKey) deleteResourceFile(existing.fileKey);
	res.json({ item });
});

router.delete("/:id", async (req, res) => {
	const existing = await findItem(req.params.id);
	if (!existing) return res.status(404).json({ message: "Item not found." });
	await prisma.contentItem.delete({ where: { id: existing.id } });
	deleteResourceFile(existing.fileKey);
	res.json({ ok: true });
});

module.exports = router;
```

- [ ] **Step 4: PDF upload** — in `backend/src/routes/upload.js`, add (keep the image route unchanged; `router.use(requireAdmin)` already precedes routes — place this after it):

```js
const { newResourceKey, resourcePath } = require("../lib/resourceFiles");

const pdfUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 20 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		if (file.mimetype !== "application/pdf") return cb(new Error("Only PDF files are allowed."));
		cb(null, true);
	},
});

router.post("/resource", (req, res) => {
	pdfUpload.single("file")(req, res, err => {
		if (err) {
			const message = err.code === "LIMIT_FILE_SIZE" ? "PDFs must be 20 MB or smaller." : err.message;
			return res.status(400).json({ message });
		}
		if (!req.file) return res.status(400).json({ message: "No PDF file was uploaded." });
		// Check the file really is a PDF, not just labelled as one.
		if (req.file.buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
			return res.status(400).json({ message: "That file isn't a valid PDF." });
		}
		const fileKey = newResourceKey();
		fs.writeFileSync(resourcePath(fileKey), req.file.buffer);
		res.status(201).json({ fileKey });
	});
});
```

- [ ] **Step 5: News AI prompt** — in `adminAi.js` add to `SYSTEM_PROMPTS`:
```js
	news: [
		"You write company news items for DPDP Consultants, a data privacy and DPDP Act 2023",
		"compliance consultancy in India. Given a topic, return ONLY a JSON object with keys",
		"\"title\", \"excerpt\", \"content\" - no markdown code fences, no commentary.",
		'"title": a factual news headline. "excerpt": one sentence under 160 characters.',
		'"content": 3-4 short paragraphs of clean HTML using only <p>, <ul>, <li> and <strong>.',
		"Neutral, factual tone; do not invent dates, figures or quotes.",
	].join(" "),
```
and change the unknown-type message to `"type must be 'blog', 'job' or 'news'."` (update `adminAi.test.js` only if it asserts that text).

- [ ] **Step 6:** Mount `app.use("/api/admin/content", adminContentRouter);` in `app.js`. Run `npm test` → PASS.

- [ ] **Step 7: Commit**
```bash
git add backend/src/routes/adminContent.js backend/src/routes/adminContent.test.js backend/src/routes/upload.js backend/src/routes/adminAi.js backend/src/routes/adminAi.test.js backend/src/app.js
git commit -m "Add admin content CRUD, private PDF upload and news AI drafts"
```

---

### Task 5: Webinar and resource lead types

**Files:**
- Modify: `backend/src/lib/leadTypes.js`, `backend/src/routes/contact.js`, `backend/src/routes/adminMessages.js`, `backend/src/lib/mailer.js`
- Test: `backend/src/lib/leadTypes.test.js`, `backend/src/routes/contact.test.js`, `backend/src/routes/adminMessages.test.js`

**Interfaces:**
- Consumes: `ContentItem`, `signDownloadToken`.
- Produces: `LEAD_TYPES.webinar` / `LEAD_TYPES.resource` (with `contentKind: "event"` / `"resource"`); `/start` accepts `contentId`; completion responses for `resource` are `{ done: true, downloadUrl }` with `downloadUrl = /api/content/resource/<slug>/download?token=<t>`; saved leads carry `contentId`, `contentTitle`; CSV gains a `For` column right after `Type`.

- [ ] **Step 1: leadTypes** — add:
```js
	webinar: {
		label: "Webinar",
		department: "Webinars",
		contentKind: "event",
		fields: ["name", "email", "phone", "company"],
		required: ["name", "email", "phone", "company"],
	},
	resource: {
		label: "Resource",
		department: "Whitepapers",
		contentKind: "resource",
		fields: ["name", "email", "phone", "company"],
		required: ["name", "email", "phone", "company"],
	},
```
Update the departments test to include `Webinars` and `Whitepapers`, and add a test that both types accept name/email/phone/company and reject a missing company.

- [ ] **Step 2: Failing route tests** (append to `contact.test.js`; create content items with `prisma.contentItem.create`):

```js
const hours = n => new Date(Date.now() + n * 60 * 60 * 1000);
const leadFor = (type, contentId) => ({
	type,
	contentId,
	name: "Asha",
	email: freshEmail(),
	phone: "9000000010",
	company: "Acme",
});

test("webinar registration uses the Webinars department and stores the event title", async () => {
	portalOn();
	const event = await prisma.contentItem.create({
		data: { kind: "event", title: "DPDP Rules Webinar", slug: `webinar-${Date.now()}`, summary: "S", published: true, startsAt: hours(48), format: "online" },
	});
	const app = buildApp();
	const lead = leadFor("webinar", event.id);
	const { body } = await start(app, freshIp(), lead);
	assert.equal(portalCalls[0].department, "Webinars");
	const done = await request(app).post("/api/contact/verify").send({ verificationId: body.verificationId, otp: "123456", recaptchaToken: "tok" });
	assert.deepEqual(done.body, { done: true });
	const saved = await prisma.contactSubmission.findFirst({ where: { email: lead.email } });
	assert.equal(saved.contentId, event.id);
	assert.equal(saved.contentTitle, "DPDP Rules Webinar");
	assert.equal(saved.service, "DPDP Rules Webinar");
});

test("registration closes once the event has started", async () => {
	portalOn();
	const event = await prisma.contentItem.create({
		data: { kind: "event", title: "Started", slug: `started-${Date.now()}`, summary: "S", published: true, startsAt: hours(-1), format: "online" },
	});
	const res = await start(buildApp(), freshIp(), leadFor("webinar", event.id));
	assert.equal(res.status, 400);
	assert.equal(res.body.message, "Registration for this event has closed.");
	assert.equal(portalCalls.length, 0);
});

test("content must exist, be published and match the lead type", async () => {
	portalOn();
	const draft = await prisma.contentItem.create({
		data: { kind: "event", title: "Draft", slug: `draft-${Date.now()}`, summary: "S", published: false, startsAt: hours(48), format: "online" },
	});
	const news = await prisma.contentItem.create({
		data: { kind: "news", title: "News", slug: `news-${Date.now()}`, summary: "S", published: true },
	});
	const app = buildApp();
	for (const contentId of [draft.id, news.id, 999999, "abc", undefined]) {
		const res = await start(app, freshIp(), leadFor("webinar", contentId));
		assert.equal(res.status, 400, String(contentId));
	}
	assert.equal(portalCalls.length, 0);
});

test("resource leads need a gated resource with a file and return a download link", async () => {
	consentPortal.isConfigured = () => false;
	const slug = `guide-${Date.now()}`;
	const resource = await prisma.contentItem.create({
		data: { kind: "resource", title: "DPDP Guide", slug, summary: "S", published: true, resourceType: "guide", fileKey: "1-1.pdf", gated: true },
	});
	const ungated = await prisma.contentItem.create({
		data: { kind: "resource", title: "Open", slug: `${slug}-open`, summary: "S", published: true, resourceType: "guide", fileKey: "1-2.pdf", gated: false },
	});
	const app = buildApp();

	const res = await start(app, freshIp(), leadFor("resource", resource.id));
	assert.equal(res.status, 201);
	assert.equal(res.body.done, true);
	assert.match(res.body.downloadUrl, new RegExp(`^/api/content/resource/${slug}/download\\?token=`));
	const token = new URL(res.body.downloadUrl, "http://x").searchParams.get("token");
	assert.equal(require("../lib/downloadTokens").verifyDownloadToken(token, resource.id), true);

	const notGated = await start(app, freshIp(), leadFor("resource", ungated.id));
	assert.equal(notGated.status, 400);
});

test("resource leads through OTP also return the download link", async () => {
	portalOn();
	const resource = await prisma.contentItem.create({
		data: { kind: "resource", title: "Checklist", slug: `check-${Date.now()}`, summary: "S", published: true, resourceType: "checklist", fileKey: "1-3.pdf", gated: true },
	});
	const app = buildApp();
	const { body } = await start(app, freshIp(), leadFor("resource", resource.id));
	assert.equal(portalCalls[0].department, "Whitepapers");
	const done = await request(app).post("/api/contact/verify").send({ verificationId: body.verificationId, otp: "123456", recaptchaToken: "tok" });
	assert.equal(done.body.done, true);
	assert.ok(done.body.downloadUrl);
});
```
Update `adminMessages.test.js`: the counts object now also has `webinar: 0, resource: 0`; the CSV header becomes `Received,Type,For,Name,Email,Phone,Company,Purpose,Partnership type,Preferred time,Message,Consent recorded,Language,UTM,Referrer`.

- [ ] **Step 3:** Run → new tests FAIL.

- [ ] **Step 4: `contact.js` changes**
1. `readLead`: add `contentId: body.contentId`.
2. Add helpers:
```js
const { signDownloadToken } = require("../lib/downloadTokens");

// Resolves and checks the content item a webinar/resource lead refers to.
// Returns { item } or { error }.
async function resolveContent(lead) {
	const contentKind = LEAD_TYPES[lead.type].contentKind;
	if (!contentKind) return {};
	const id = Number(lead.contentId);
	const item = Number.isInteger(id) ? await prisma.contentItem.findUnique({ where: { id } }) : null;
	if (!item || !item.published || item.kind !== contentKind) {
		return { error: "This item is no longer available." };
	}
	if (contentKind === "event" && item.startsAt <= new Date()) {
		return { error: "Registration for this event has closed." };
	}
	if (contentKind === "resource" && (!item.gated || !item.fileKey)) {
		return { error: "This resource isn't available for download." };
	}
	return { item };
}

async function completionBody(lead) {
	if (lead.type !== "resource") return { done: true };
	const item = await prisma.contentItem.findUnique({ where: { id: lead.contentId } });
	if (!item || !item.published) return { done: true };
	return { done: true, downloadUrl: `/api/content/resource/${item.slug}/download?token=${signDownloadToken(item.id)}` };
}
```
3. `/start`, after `normalizeLead`:
```js
	const { item, error: contentError } = await resolveContent(lead);
	if (contentError) return res.status(400).json({ message: contentError });
	lead.contentId = item ? item.id : null;
	lead.contentTitle = item ? item.title : null;
```
(before the limiters, so a bad reference never costs a portal send). The verification-off branch returns `res.status(201).json(await completionBody(lead))`. `contactVerification.create` data gains `contentId: lead.contentId, contentTitle: lead.contentTitle`.
4. `/verify` returns `res.json(await completionBody(lead))`.
5. `saveLead` data gains `contentId: lead.contentId || null, contentTitle: lead.contentTitle || null`, and `service` = `lead.contentTitle` for webinar/resource.

- [ ] **Step 5: adminMessages.js** — insert `["For", m => m.contentTitle]` after the `Type` column in `CSV_COLUMNS` (counts pick up the new types automatically).

- [ ] **Step 6: mailer.js** — add `contentTitle` to the params and a `contentTitle ? \`For: ${contentTitle}\` : null` line after `Type`.

- [ ] **Step 7:** `npm test` → all PASS.

- [ ] **Step 8: Commit**
```bash
git add backend/src/lib/leadTypes.js backend/src/lib/leadTypes.test.js backend/src/routes/contact.js backend/src/routes/contact.test.js backend/src/routes/adminMessages.js backend/src/routes/adminMessages.test.js backend/src/lib/mailer.js
git commit -m "Add webinar registration and gated resource download lead types"
```

---

### Task 6: Site form engine for webinar/resource and download hand-off

**Files:**
- Modify: `src/libs/leadForms.js`, `src/hooks/useContactForm.js`, `src/components/sections/contacts/ThankYouPrimary.js`
- Create: `src/app/api/content/resource/[slug]/download/route.js`

**Interfaces:**
- Consumes: Task 5 API.
- Produces: `LEAD_FORMS.webinar`, `LEAD_FORMS.resource`; `useContactForm(type, { contentId })`; download proxy at the same path the backend returns.

- [ ] **Step 1: `leadForms.js`** — add:
```js
	webinar: {
		fields: ["name", "email", "phone", "company"],
		required: ["name", "email", "phone", "company"],
		submitText: "Register Now",
		thankYou: "You're registered. We'll email you the joining details before the event.",
	},
	resource: {
		fields: ["name", "email", "phone", "company"],
		required: ["name", "email", "phone", "company"],
		submitText: "Get the Resource",
		thankYou: "Thank you. Your download should start automatically.",
	},
```
and export `DOWNLOAD_URL_KEY = "dpdp-download-url"`.

- [ ] **Step 2: `useContactForm.js`**
- Signature `useContactForm(type = "contact", { contentId } = {})`; add `if (contentId) payload.contentId = contentId;` when building the `/start` payload.
- `finish(data = {})`:
```js
	const finish = (data = {}) => {
		markContactSubmitted();
		if (data.downloadUrl) {
			try {
				sessionStorage.setItem(DOWNLOAD_URL_KEY, data.downloadUrl);
			} catch {}
			const link = document.createElement("a");
			link.href = data.downloadUrl;
			document.body.appendChild(link);
			link.click();
			link.remove();
		}
		router.push(`/thank-you?type=${formType}`);
	};
```
- Pass the response data at both call sites: `finish(data)` after `/start` (`data.done`) and after `/verify` (`ok`).

- [ ] **Step 3: `ThankYouPrimary.js`** — for `type === "resource"`, read `sessionStorage.getItem(DOWNLOAD_URL_KEY)` in a mount effect (try/catch) into state, and render below the message:
```jsx
{downloadUrl ? (
	<p className="mb-4">
		<a className="tj-primary-btn" href={downloadUrl}>
			<span className="btn-text"><span>Download again</span></span>
			<span className="btn-icon"><i className="tji-arrow-right-long"></i></span>
		</a>
	</p>
) : null}
```
(Link valid for 15 minutes; after that the backend's expired message explains what to do.)

- [ ] **Step 4: Download proxy** — `src/app/api/content/resource/[slug]/download/route.js`:
```js
const backendUrl = () => process.env.BACKEND_URL || "http://localhost:5000";

export async function GET(request, { params }) {
	const { slug } = await params;
	const token = new URL(request.url).searchParams.get("token") || "";
	const query = token ? `?token=${encodeURIComponent(token)}` : "";
	try {
		const res = await fetch(`${backendUrl()}/api/content/resource/${encodeURIComponent(slug)}/download${query}`, {
			cache: "no-store",
		});
		const headers = new Headers();
		for (const name of ["content-type", "content-disposition", "content-length", "cache-control"]) {
			const value = res.headers.get(name);
			if (value) headers.set(name, value);
		}
		return new Response(res.body, { status: res.status, headers });
	} catch (error) {
		console.error("Failed to reach backend for resource download:", error.message);
		return Response.json({ message: "The download is unavailable right now. Please try again." }, { status: 502 });
	}
}
```

- [ ] **Step 5:** `npx next build` → compiles.

- [ ] **Step 6: Commit**
```bash
git add src/libs/leadForms.js src/hooks/useContactForm.js src/components/sections/contacts/ThankYouPrimary.js src/app/api/content
git commit -m "Support webinar and resource leads on the site with a private download hand-off"
```

---

### Task 7: Site pages for news, events and resources

**Files:**
- Create: `src/libs/contentApi.js`, `src/libs/contentFormat.js`, `src/components/sections/content/ContentCard.js`, `ContentListing.js`, `ContentDetail.js`, `ContentLeadForm.js`, pages `src/app/news/page.js`, `src/app/news/[slug]/page.js`, `src/app/events/page.js`, `src/app/events/[slug]/page.js`, `src/app/resources/page.js`, `src/app/resources/[slug]/page.js`
- Modify: `src/app/assets/sass/layout/_contact.scss` (or a new `_content.scss` forwarded from `globals.scss`) for the new classes

**Interfaces:**
- Consumes: public API (Task 3), `useContactForm(type, { contentId })`, `ContactFormBody`, `leadForm(type)`.

- [ ] **Step 1: `src/libs/contentApi.js`** (server-only fetch helpers)
```js
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const EMPTY_PAGE = { items: [], total: 0, page: 1, pageSize: 9 };

export async function getContentList({ kind, page = 1, resourceType, when } = {}) {
	const params = new URLSearchParams({ kind, page: String(page) });
	if (resourceType) params.set("resourceType", resourceType);
	if (when) params.set("when", when);
	try {
		const res = await fetch(`${BACKEND_URL}/api/content?${params}`, { cache: "no-store" });
		return res.ok ? await res.json() : EMPTY_PAGE;
	} catch {
		return EMPTY_PAGE;
	}
}

export async function getContentItem(kind, slug) {
	try {
		const res = await fetch(`${BACKEND_URL}/api/content/${kind}/${encodeURIComponent(slug)}`, { cache: "no-store" });
		return res.ok ? (await res.json()).item : null;
	} catch {
		return null;
	}
}
```

- [ ] **Step 2: `src/libs/contentFormat.js`**
```js
const TZ = "Asia/Kolkata";

export const EVENT_FORMAT_LABELS = { online: "Online", in_person: "In person" };
export const RESOURCE_TYPE_FILTERS = [
	{ value: "", label: "All" },
	{ value: "whitepaper", label: "Whitepapers" },
	{ value: "guide", label: "Guides" },
	{ value: "checklist", label: "Checklists" },
	{ value: "report", label: "Reports" },
];
export const RESOURCE_TYPE_LABELS = { whitepaper: "Whitepaper", guide: "Guide", checklist: "Checklist", report: "Report" };

export function formatDate(value) {
	return value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: TZ }) : "";
}

export function formatDateTime(value) {
	if (!value) return "";
	const text = new Date(value).toLocaleString("en-IN", {
		day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ,
	});
	return `${text} IST`;
}

export function isUpcoming(item) {
	return new Date(item.startsAt) > new Date();
}

export function pageFrom(value) {
	const page = Number.parseInt(value, 10);
	return Number.isInteger(page) && page > 0 ? page : 1;
}
```

- [ ] **Step 3: Components** (in `src/components/sections/content/`)

`ContentCard.js` (server component; reuses blog card classes):
```js
import Link from "next/link";

const ContentCard = ({ href, image, eyebrow, title, summary, meta }) => (
	<div className="blog-item content-card">
		<div className="blog-thumb">
			<Link href={href}>
				<img src={image || "/images/blog/blog-1.webp"} alt="" loading="lazy" />
			</Link>
		</div>
		<div className="blog-content">
			<div className="blog-meta">
				{eyebrow ? <span className="categories">{eyebrow}</span> : null}
				{meta ? <span>{meta}</span> : null}
			</div>
			<h4 className="title">
				<Link href={href}>{title}</Link>
			</h4>
			{summary ? <p className="content-card-summary">{summary}</p> : null}
			<Link className="text-btn" href={href}>
				<span className="btn-text"><span>Read More</span></span>
				<span className="btn-icon"><i className="tji-arrow-right-long"></i></span>
			</Link>
		</div>
	</div>
);

export default ContentCard;
```

`ContentListing.js`:
```js
import Link from "next/link";

// cards: [{ key, node }] already rendered; buildHref(page) -> string
const ContentListing = ({ cards, total, page, pageSize, buildHref, emptyText, filters }) => {
	const pages = Math.max(1, Math.ceil(total / pageSize));
	return (
		<section className="tj-content-listing section-gap">
			<div className="container">
				{filters ? <div className="content-filters">{filters}</div> : null}
				{cards.length ? (
					<div className="row row-gap-4">
						{cards.map(card => (
							<div className="col-lg-4 col-md-6" key={card.key}>
								{card.node}
							</div>
						))}
					</div>
				) : (
					<div className="content-empty">
						<p>{emptyText}</p>
					</div>
				)}
				{pages > 1 ? (
					<nav className="content-pagination" aria-label="Pagination">
						{Array.from({ length: pages }, (_, i) => i + 1).map(n => (
							<Link key={n} href={buildHref(n)} className={n === page ? "active" : ""} aria-current={n === page ? "page" : undefined}>
								{n}
							</Link>
						))}
					</nav>
				) : null}
			</div>
		</section>
	);
};

export default ContentListing;
```

`ContentDetail.js`:
```js
// Body HTML is authored by admins in the rich-text editor (same trust model as blogs).
const ContentDetail = ({ item, meta, aside }) => (
	<section className="tj-content-detail section-gap">
		<div className="container">
			<div className="row row-gap-5">
				<div className={aside ? "col-lg-7" : "col-lg-10 mx-auto"}>
					{item.coverImage ? <img className="content-detail-cover" src={item.coverImage} alt="" /> : null}
					{meta ? <div className="content-detail-meta">{meta}</div> : null}
					<h2 className="content-detail-title">{item.title}</h2>
					<p className="content-detail-summary">{item.summary}</p>
					<div className="content-detail-body" dangerouslySetInnerHTML={{ __html: item.body || "" }} />
				</div>
				{aside ? <div className="col-lg-5">{aside}</div> : null}
			</div>
		</div>
	</section>
);

export default ContentDetail;
```

`ContentLeadForm.js`:
```js
"use client";
import ContactFormBody from "@/components/sections/contacts/ContactFormBody";
import useContactForm from "@/hooks/useContactForm";
import { leadForm } from "@/libs/leadForms";

const ContentLeadForm = ({ type, contentId, title, intro }) => {
	const form = useContactForm(type, { contentId });
	return (
		<div className="contact-form lead-form-card content-lead-form">
			<h3 className="title">{title}</h3>
			{intro ? <p>{intro}</p> : null}
			<form onSubmit={form.handleSubmit} noValidate>
				<ContactFormBody form={form} submitText={leadForm(type).submitText} />
			</form>
		</div>
	);
};

export default ContentLeadForm;
```

- [ ] **Step 4: Pages.** All use the inner-page layout from `src/app/contact/page.js` (BackToTop, two Headers, smooth wrapper, HeaderSpace, HeroInner, section, Cta, Footer, ClientWrapper). `params`/`searchParams` are Promises.

- `src/app/news/page.js`: `metadata = { title: "News | DPDP Consultants", description: "Company news, announcements and DPDP Act updates from DPDP Consultants." }`. Reads `page`, calls `getContentList({ kind: "news", page })`, renders `HeroInner title="News"` and `ContentListing` with `ContentCard` (`href=/news/<slug>`, `eyebrow="News"`, `meta=formatDate(publishedAt)`), `buildHref = n => (n === 1 ? "/news" : \`/news?page=${n}\`)`, `emptyText="No news yet. Check back soon."`.
- `src/app/news/[slug]/page.js`: `generateMetadata` → `{ title: \`${item.title} | DPDP Consultants\`, description: item.summary, openGraph: item.coverImage ? { images: [item.coverImage] } : undefined }` (fallback title when missing); page calls `getContentItem("news", slug)` → `notFound()` if null; `ContentDetail` with `meta={formatDate(item.publishedAt)}` and, when `sourceUrl`, a "Read the original" link (`target="_blank" rel="noopener noreferrer"`) appended under the body via the `meta` or a small footer element.
- `src/app/events/page.js`: `metadata` "Webinars & Events | DPDP Consultants". Reads `when` (`"past"` or upcoming) and `page`; tabs as two `Link`s ("Upcoming" → `/events`, "Past" → `/events?when=past`) passed as `filters` with `content-filter active` classes; cards `eyebrow = EVENT_FORMAT_LABELS[item.format]`, `meta = formatDateTime(item.startsAt)`; empty text "No upcoming events right now." / "No past events yet.".
- `src/app/events/[slug]/page.js`: `getContentItem("event", slug)`; meta shows `formatDateTime(startsAt)` (and `– formatDateTime(endsAt)` when set), format label and venue. `aside`: if `isUpcoming(item)` → `<ContentLeadForm type="webinar" contentId={item.id} title="Register for this event" />`; else if `recordingUrl` → a card with "Watch the recording" link; else a card "This event has ended.".
- `src/app/resources/page.js`: `metadata` "Resources | DPDP Consultants". Reads `type` and `page`; filter chips from `RESOURCE_TYPE_FILTERS` as `Link`s (`/resources` or `/resources?type=<v>`, active when matching); `getContentList({ kind: "resource", page, resourceType: type })`; cards `eyebrow = RESOURCE_TYPE_LABELS[item.resourceType]`, `meta = item.gated ? "Free download · form required" : "Free download"`; pagination keeps `type`.
- `src/app/resources/[slug]/page.js`: `getContentItem("resource", slug)`; `aside`: gated → `<ContentLeadForm type="resource" contentId={item.id} title="Get this resource" intro="Fill in your details and the download will start straight away." />`; ungated with `hasFile` → a card with a Download button linking to `/api/content/resource/<slug>/download`; no file → card "This resource will be available soon.".

Write every page in full.

- [ ] **Step 5: Styles** — add a `_content.scss` (forward it in `src/app/globals.scss` after `contact`) with: `.content-card-summary` (2-line clamp), `.content-filters` (flex wrap, gap 10px, margin-bottom 30px), `.content-filter` pill links (border 1px solid var(--tj-color-border-1), radius 999px, padding 8px 18px; `.active` filled with `--tj-color-theme-primary` and white text), `.content-empty` (centered, padding 60px 0, muted), `.content-pagination` (centered flex, gap 8px, 40px square links, `.active` filled primary), `.content-detail-cover` (width 100%, radius 12px, margin-bottom 24px), `.content-detail-meta` (muted, 15px, margin-bottom 10px), `.content-detail-title` (40px/1.2, 32px under md), `.content-detail-summary` (18px, heading color), `.content-detail-body` (p margins, lists padded), `.content-side-card` (white, radius 12px, padding 30px, shadow like `.lead-form-card`).

- [ ] **Step 6: Build + smoke.** `npx next build` → compiles, routes list includes the six pages.
Smoke (never touch the user's :4000/:5000):
1. Seed three published items into the dev DB with a small node script using `require("./backend/src/lib/prisma")` (run from `backend/`): `smoke-news` (news), `smoke-event` (event, starts in 3 days, online), `smoke-resource` (resource, guide, ungated, no file).
2. Start `cd backend && PORT=5055 node src/server.js` and `BACKEND_URL=http://localhost:5055 npx next start -p 4010` in the background.
3. `curl -s -o /dev/null -w "%{http_code}"` each of `/news`, `/news/smoke-news`, `/events`, `/events?when=past`, `/events/smoke-event`, `/resources`, `/resources?type=guide`, `/resources/smoke-resource` → 200; `/news/does-not-exist` → 404; `curl -s http://localhost:4010/events/smoke-event | grep -c "Register Now"` → ≥ 1.
4. Stop only the two processes you started (find them by port with `netstat -ano`, `taskkill //PID <pid> //F`), then delete the three `smoke-` items with the same script approach. Record everything in the report.

- [ ] **Step 7: Commit**
```bash
git add src/libs/contentApi.js src/libs/contentFormat.js src/components/sections/content src/app/news src/app/events src/app/resources src/app/assets/sass src/app/globals.scss
git commit -m "Add news, events and resources pages"
```

---

### Task 8: Admin Content section and lead tabs

**Files:**
- Create: `admin/src/components/ContentForm.js`, `admin/src/app/content/page.js`, `admin/src/app/content/new/page.js`, `admin/src/app/content/[id]/edit/page.js`, `admin/src/lib/contentKinds.js`
- Modify: `admin/src/lib/navLinks.js`, `admin/src/lib/leadTypes.js`, `admin/src/components/MessageDetailModal.js`, `admin/src/app/globals.css` (only if new classes are needed)

**Interfaces:**
- Consumes: admin API (Task 4), `apiFetch`, `BACKEND_URL`, `RichTextEditor`, `AiDraftPanel` (type `news`).

- [ ] **Step 1: `admin/src/lib/contentKinds.js`**
```js
export const CONTENT_TABS = [
	{ value: "news", label: "News", singular: "News item" },
	{ value: "event", label: "Events", singular: "Event" },
	{ value: "resource", label: "Resources", singular: "Resource" },
];
export const EVENT_FORMATS = [
	{ value: "online", label: "Online" },
	{ value: "in_person", label: "In person" },
];
export const RESOURCE_TYPES = [
	{ value: "whitepaper", label: "Whitepaper" },
	{ value: "guide", label: "Guide" },
	{ value: "checklist", label: "Checklist" },
	{ value: "report", label: "Report" },
];
export function kindConfig(kind) {
	return CONTENT_TABS.find(tab => tab.value === kind) || CONTENT_TABS[0];
}
// "2026-10-05T04:30:00.000Z" -> "2026-10-05T10:00" in the admin's local time, and back.
export function toLocalInput(value) {
	if (!value) return "";
	const date = new Date(value);
	return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function fromLocalInput(value) {
	return value ? new Date(value).toISOString() : "";
}
```

- [ ] **Step 2: `ContentForm.js`** — modelled on `BlogForm.js` (same `form`, `form-row`, `form-field`, checkbox and actions markup). Props `{ kind, initialValues, onSubmit, submitLabel }`. State holds: `title, slug, summary, body, coverImage, published (default false), publishedAt, sourceUrl, startsAt, endsAt, format ("online"), venue, recordingUrl, resourceType ("whitepaper"), fileKey, gated (true)`; dates held as local-input strings via `toLocalInput`, converted back with `fromLocalInput` on submit. Slug auto-derives from title until touched (copy `slugify` and the `slugTouched` logic from `BlogForm`).
- News only: `<AiDraftPanel type="news" ... />` mapping `result.title → title`, `result.excerpt → summary`, `result.content → body`; plus "Source link (optional)" input.
- Shared: Title, Slug, Summary (textarea, maxLength 300, with a live counter), Body (`RichTextEditor`), Cover image (text input for a URL plus an "Upload image" button that posts `FormData` with field `image` to `${BACKEND_URL}/api/admin/upload` using `fetch(..., { method: "POST", body, credentials: "include" })` and stores `${BACKEND_URL}${data.url}`; show a small preview when set), Publish date (`datetime-local`), Published checkbox.
- Event: Starts (required `datetime-local`), Ends (optional), Format (`select` from `EVENT_FORMATS`), Venue / joining info, Recording link.
- Resource: Type (`select` from `RESOURCE_TYPES`), PDF upload (file input `accept="application/pdf"` → `FormData` field `file` to `${BACKEND_URL}/api/admin/upload/resource`, stores `fileKey`; show "Current file: <fileKey>" or "No file uploaded yet"; show the server's error message on failure), "Gated (visitors fill a form before downloading)" checkbox.
- Submit sends `{ kind, ...values, publishedAt/startsAt/endsAt converted }`; server errors show in `<p className="error">`.

- [ ] **Step 3: Pages**
- `admin/src/app/content/page.js`: `RequireAuth`; Breadcrumbs Dashboard → Content; tabs (reuse `.filter-tabs` / `.filter-tab` classes from Messages) for `CONTENT_TABS`, state `kind` (default `news`) with the same stale-response guard as Messages (`latestKind` ref); "New <singular>" button linking to `/content/new?kind=<kind>`; table columns Title, Status (`badge`: Published/Draft), Date (events: start; others: publish date), Actions (Edit link to `/content/<id>/edit`, Delete button with `confirm("Delete this item? This can't be undone.")` → `DELETE` then reload). Skeleton rows while loading; empty state row "Nothing here yet.".
- `admin/src/app/content/new/page.js`: reads `kind` from `useSearchParams()` (wrap the inner component in `<Suspense>` as Next requires), renders `ContentForm`, POSTs to `/api/admin/content`, then `router.push("/content")`.
- `admin/src/app/content/[id]/edit/page.js`: loads `/api/admin/content/<id>`, skeleton while loading, `ContentForm` with `kind={item.kind}` and `initialValues={item}`, PUT on submit, then back to `/content`.

- [ ] **Step 4: Nav + messages**
- `navLinks.js`: add `{ href: "/content", label: "Content", Icon: DocumentIcon }` after Blogs.
- `admin/src/lib/leadTypes.js`: add `{ value: "webinar", label: "Webinar" }` and `{ value: "resource", label: "Resource" }` to `LEAD_TYPE_TABS`.
- `MessageDetailModal.js`: after Type, add `<div><dt>For</dt><dd>{message.contentTitle || "—"}</dd></div>`.

- [ ] **Step 5:** `cd admin && npx next build` → compiles.

- [ ] **Step 6: Commit**
```bash
git add admin/src
git commit -m "Add admin Content section and webinar/resource lead tabs"
```
