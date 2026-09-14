# Backend + Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone backend (Express + Prisma/SQLite) and a separately-deployable Admin Panel (Next.js) so blog posts and contact submissions are managed dynamically, while the live site keeps working (with a static-file fallback) and its existing UI is left otherwise untouched.

**Architecture:** Three independent apps in one repo: `backend/` (Express API + SQLite via Prisma, owns the database and email sending), `admin/` (a separate Next.js app, calls `backend` directly over HTTP with credentialed CORS), and the existing live site at the repo root (`src/`, unchanged location) whose blog-related API routes become thin server-side proxies to `backend` with a fallback to the existing `public/fakedata/blogs.json` if `backend` is unreachable.

**Tech Stack:** Backend: Node.js, Express, Prisma ORM, SQLite, `bcryptjs` (pure JS — avoids native-module build issues), `jsonwebtoken`, `cookie-parser`, `cors`, `nodemailer`, `dotenv`. Tests: Node's built-in `node:test` + `supertest` (no extra test framework). Admin: Next.js (App Router, JavaScript, same major version as the live site), no UI framework beyond plain CSS (this is an internal tool).

**Spec:** `docs/superpowers/specs/2026-09-14-backend-and-admin-panel-design.md`

## Global Constraints

- Live site's existing UI components (blog cards, `BlogMain`, etc.) must not change their prop/field names — a backend-side adapter maps DB rows to the exact legacy shape (`id`, `slug`, `title`, `desc`, `img`, `category`, `tags`, `author`, `author_role`, `status`, `date`, `date2`, `day`, `month`) already consumed across ~13 files.
- `public/fakedata/blogs.json` is never deleted — it's the seed source and the live site's fallback when the backend is unreachable.
- Only `/blogs`, `/blogs/[slug]`, and the site's `/api/blogs*`/`/api/contact` routes become backend-driven. The 11 home-page demo "latest posts" widgets, sidebar widgets, and `/blog-grid`/`/blog-list`/`/blog-sidebar` demo pages keep reading the static file unchanged — explicitly out of scope (confirmed with the user).
- Contact submissions must always be saved even when SMTP is not configured; email sending is best-effort and must never fail the request.
- Password hashing uses `bcryptjs` (not `bcrypt`) to avoid native-module compilation on Windows.
- Backend uses CommonJS (`require`/`module.exports`) throughout — simplest, most compatible default for a fresh Express app.

---

## Task 1: Backend project scaffold + database schema

**Files:**
- Create: `backend/package.json`
- Create: `backend/.gitignore`
- Create: `backend/.env.example`
- Create: `backend/prisma/schema.prisma`

**Interfaces:**
- Produces: a `backend/` npm project with `express`, `cors`, `cookie-parser`, `dotenv`, `bcryptjs`, `jsonwebtoken`, `nodemailer`, `@prisma/client` as dependencies and `prisma`, `supertest` as dev dependencies; a migrated SQLite database at `backend/data/dev.db` with `Blog`, `ContactSubmission`, and `Admin` tables. Every later backend task builds on this.

- [ ] **Step 1: Create the backend folder and initialize npm**

Run (from the repo root):
```bash
mkdir backend
cd backend
npm init -y
```

- [ ] **Step 2: Install dependencies**

Run (from `backend/`):
```bash
npm install express cors cookie-parser dotenv bcryptjs jsonwebtoken nodemailer @prisma/client
npm install -D prisma supertest
```

- [ ] **Step 3: Set package.json scripts**

Edit `backend/package.json`, replace the `"scripts"` block with:

```json
"scripts": {
  "dev": "node --watch src/server.js",
  "start": "node src/server.js",
  "test": "node --test src/",
  "seed": "node prisma/seed.js"
},
```

- [ ] **Step 4: Create `backend/.gitignore`**

```
node_modules
data/*.db
data/*.db-journal
.env
```

- [ ] **Step 5: Create the data directory**

Run (from `backend/`):
```bash
mkdir data
```

- [ ] **Step 6: Write `backend/.env.example`**

```
DATABASE_URL="file:../data/dev.db"
JWT_SECRET=replace-with-a-long-random-string
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me-now
PORT=5000
CORS_ORIGIN=http://localhost:3001

# Optional, deferred until you're ready to send real emails
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=
```

Note: the SQLite path is relative to `backend/prisma/` (where `schema.prisma` lives), so `../data/dev.db` resolves to `backend/data/dev.db`.

- [ ] **Step 7: Copy to a real `.env` for local development**

Run (from `backend/`):
```bash
cp .env.example .env
```

Edit `backend/.env` and set `JWT_SECRET` to any random string (e.g. `openssl rand -hex 32`, or just type 40 random characters), and set `ADMIN_EMAIL`/`ADMIN_PASSWORD` to whatever you want your local admin login to be. Leave the `SMTP_*` values blank for now.

- [ ] **Step 8: Write `backend/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Blog {
  id          Int      @id @default(autoincrement())
  slug        String   @unique
  title       String
  excerpt     String?
  content     String?
  img         String?
  category    String?
  tags        String?
  author      String?
  authorRole  String?
  status      String?
  published   Boolean  @default(true)
  publishedAt DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ContactSubmission {
  id        Int      @id @default(autoincrement())
  name      String
  email     String
  phone     String?
  service   String?
  message   String
  status    String   @default("new")
  createdAt DateTime @default(now())
}

model Admin {
  id           Int    @id @default(autoincrement())
  email        String @unique
  passwordHash String
}
```

- [ ] **Step 9: Run the initial migration**

Run (from `backend/`):
```bash
npx prisma migrate dev --name init
```

Expected: it creates `backend/prisma/migrations/`, applies the schema to `backend/data/dev.db`, and generates the Prisma client into `node_modules/@prisma/client`. No errors.

- [ ] **Step 10: Verify the database was created**

Run (from `backend/`):
```bash
node -e "const {PrismaClient}=require('@prisma/client'); new PrismaClient().blog.findMany().then(r=>{console.log('OK, blog count:', r.length); process.exit(0)})"
```

Expected: prints `OK, blog count: 0`.

- [ ] **Step 11: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/.gitignore backend/.env.example backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "Scaffold backend: Express project + Prisma/SQLite schema"
```

---

## Task 2: Blog data adapter + makePath helper

**Files:**
- Create: `backend/src/lib/makePath.js`
- Create: `backend/src/lib/adapter.js`
- Test: `backend/src/lib/adapter.test.js`

**Interfaces:**
- Produces: `mapBlogToLegacyShape(blog)` — maps a raw Prisma `Blog` row to the exact field shape the live site's UI expects (`id, slug, title, desc, content, img, category, tags, author, author_role, status, day, month, date, date2`). `serializeAdminBlog(blog)` — maps a raw Prisma `Blog` row to a shape for the Admin Panel (same fields as the Prisma model, with `tags` parsed from its JSON string into an array). `makePath(text)` — string helper, ported from the site's `src/libs/makePath.js`, used to match category/author-role query filters the same way the site already does.
- Consumed by: Task 5 (public blogs route), Task 9 (admin blogs routes).

- [ ] **Step 1: Write `backend/src/lib/makePath.js`**

```js
function makePath(text) {
	if (!text) return "#";
	const normalized = text.toLowerCase().split("/").join(" ").split("&").join(" ");
	return normalized.split(" ").join("_");
}

module.exports = makePath;
```

- [ ] **Step 2: Write the failing test for the adapter**

Create `backend/src/lib/adapter.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { mapBlogToLegacyShape, serializeAdminBlog } = require("./adapter");

test("maps a full blog row to the legacy shape", () => {
	const blog = {
		id: 1,
		slug: "hello-world",
		title: "Hello World",
		excerpt: "A short teaser",
		content: "Full body text",
		img: "/images/blog/blog-1.webp",
		category: "Corporate",
		tags: JSON.stringify(["Corporate", "Business"]),
		author: "gerold",
		authorRole: "Analysis",
		status: "Tutorial",
		publishedAt: new Date("2025-12-28T00:00:00.000Z"),
	};

	const result = mapBlogToLegacyShape(blog);

	assert.equal(result.id, 1);
	assert.equal(result.slug, "hello-world");
	assert.equal(result.desc, "A short teaser");
	assert.equal(result.content, "Full body text");
	assert.deepEqual(result.tags, ["Corporate", "Business"]);
	assert.equal(result.author_role, "Analysis");
	assert.equal(result.day, 28);
	assert.equal(result.month, "DEC");
	assert.equal(result.date, "28 DEC 2025");
});

test("defaults tags to an empty array when null", () => {
	const blog = {
		id: 2,
		slug: "no-tags",
		title: "No Tags",
		tags: null,
		publishedAt: new Date("2025-01-01T00:00:00.000Z"),
	};

	const result = mapBlogToLegacyShape(blog);

	assert.deepEqual(result.tags, []);
});

test("serializeAdminBlog parses tags into an array and keeps other fields as-is", () => {
	const blog = {
		id: 3,
		slug: "admin-post",
		title: "Admin Post",
		published: false,
		tags: JSON.stringify(["A", "B"]),
	};

	const result = serializeAdminBlog(blog);

	assert.equal(result.id, 3);
	assert.equal(result.published, false);
	assert.deepEqual(result.tags, ["A", "B"]);
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run (from `backend/`):
```bash
node --test src/lib/adapter.test.js
```

Expected: FAIL — `Cannot find module './adapter'`.

- [ ] **Step 4: Write `backend/src/lib/adapter.js`**

```js
function formatDate(date) {
	const d = new Date(date);
	const day = d.getUTCDate();
	const month = d
		.toLocaleString("en-US", { month: "short", timeZone: "UTC" })
		.toUpperCase();
	const year = d.getUTCFullYear();
	return {
		day,
		month,
		date: `${String(day).padStart(2, "0")} ${month} ${year}`,
		date2: d.toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			timeZone: "UTC",
		}),
	};
}

function parseTags(tags) {
	try {
		return tags ? JSON.parse(tags) : [];
	} catch {
		return [];
	}
}

function mapBlogToLegacyShape(blog) {
	const { day, month, date, date2 } = formatDate(blog.publishedAt);

	return {
		id: blog.id,
		slug: blog.slug,
		title: blog.title,
		desc: blog.excerpt || "",
		content: blog.content || "",
		img: blog.img || "/images/blog/blog-1.webp",
		category: blog.category || "",
		tags: parseTags(blog.tags),
		author: blog.author || "",
		author_role: blog.authorRole || "",
		status: blog.status || "",
		day,
		month,
		date,
		date2,
	};
}

function serializeAdminBlog(blog) {
	return { ...blog, tags: parseTags(blog.tags) };
}

module.exports = { mapBlogToLegacyShape, serializeAdminBlog };
```

- [ ] **Step 5: Run the test to verify it passes**

Run (from `backend/`):
```bash
node --test src/lib/adapter.test.js
```

Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add backend/src/lib/makePath.js backend/src/lib/adapter.js backend/src/lib/adapter.test.js
git commit -m "Add blog adapter and makePath helper"
```

---

## Task 3: Auth helpers + requireAdmin middleware

**Files:**
- Create: `backend/src/lib/auth.js`
- Create: `backend/src/middleware/requireAdmin.js`
- Test: `backend/src/middleware/requireAdmin.test.js`

**Interfaces:**
- Produces: `signAdminToken(admin)` → JWT string (from `{ id, email }`). `verifyAdminToken(token)` → decoded payload `{ adminId, email }` or `null`. `COOKIE_NAME` → `"admin_token"`. `requireAdmin(req, res, next)` — Express middleware; on success sets `req.admin` to the decoded payload; on failure responds `401 { message }`.
- Consumed by: Task 8 (admin auth routes), Task 9 (admin blogs routes), Task 10 (admin messages routes).

- [ ] **Step 1: Write `backend/src/lib/auth.js`**

```js
const jwt = require("jsonwebtoken");

const COOKIE_NAME = "admin_token";

function signAdminToken(admin) {
	return jwt.sign(
		{ adminId: admin.id, email: admin.email },
		process.env.JWT_SECRET,
		{ expiresIn: "7d" }
	);
}

function verifyAdminToken(token) {
	try {
		return jwt.verify(token, process.env.JWT_SECRET);
	} catch {
		return null;
	}
}

module.exports = { signAdminToken, verifyAdminToken, COOKIE_NAME };
```

- [ ] **Step 2: Write the failing test for requireAdmin**

Create `backend/src/middleware/requireAdmin.test.js`:

```js
process.env.JWT_SECRET = "test-secret";

const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");
const requireAdmin = require("./requireAdmin");
const { signAdminToken, COOKIE_NAME } = require("../lib/auth");

function buildTestApp() {
	const app = express();
	app.use(cookieParser());
	app.get("/protected", requireAdmin, (req, res) => {
		res.json({ adminId: req.admin.adminId });
	});
	return app;
}

test("rejects requests with no cookie", async () => {
	const app = buildTestApp();
	const res = await request(app).get("/protected");
	assert.equal(res.status, 401);
});

test("rejects requests with an invalid cookie", async () => {
	const app = buildTestApp();
	const res = await request(app)
		.get("/protected")
		.set("Cookie", `${COOKIE_NAME}=not-a-real-token`);
	assert.equal(res.status, 401);
});

test("allows requests with a valid cookie", async () => {
	const app = buildTestApp();
	const token = signAdminToken({ id: 1, email: "admin@example.com" });
	const res = await request(app)
		.get("/protected")
		.set("Cookie", `${COOKIE_NAME}=${token}`);
	assert.equal(res.status, 200);
	assert.equal(res.body.adminId, 1);
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run (from `backend/`):
```bash
node --test src/middleware/requireAdmin.test.js
```

Expected: FAIL — `Cannot find module './requireAdmin'`.

- [ ] **Step 4: Write `backend/src/middleware/requireAdmin.js`**

```js
const { verifyAdminToken, COOKIE_NAME } = require("../lib/auth");

function requireAdmin(req, res, next) {
	const token = req.cookies?.[COOKIE_NAME];
	const payload = token ? verifyAdminToken(token) : null;

	if (!payload) {
		return res.status(401).json({ message: "Not authenticated." });
	}

	req.admin = payload;
	next();
}

module.exports = requireAdmin;
```

- [ ] **Step 5: Run the test to verify it passes**

Run (from `backend/`):
```bash
node --test src/middleware/requireAdmin.test.js
```

Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add backend/src/lib/auth.js backend/src/middleware/requireAdmin.js backend/src/middleware/requireAdmin.test.js
git commit -m "Add JWT auth helpers and requireAdmin middleware"
```

---

## Task 4: Seed script

**Files:**
- Create: `backend/prisma/seed.js`

**Interfaces:**
- Consumes: `public/fakedata/blogs.json` (repo root), `process.env.ADMIN_EMAIL`/`ADMIN_PASSWORD`.
- Produces: one `Admin` row and one `Blog` row per entry in `blogs.json`, idempotently (safe to run more than once).

- [ ] **Step 1: Write `backend/prisma/seed.js`**

```js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
	const adminEmail = process.env.ADMIN_EMAIL;
	const adminPassword = process.env.ADMIN_PASSWORD;

	if (!adminEmail || !adminPassword) {
		throw new Error(
			"ADMIN_EMAIL and ADMIN_PASSWORD must be set in backend/.env before seeding."
		);
	}

	const existingAdmin = await prisma.admin.findFirst();
	if (!existingAdmin) {
		const passwordHash = await bcrypt.hash(adminPassword, 10);
		await prisma.admin.create({ data: { email: adminEmail, passwordHash } });
		console.log(`Created admin account for ${adminEmail}`);
	} else {
		console.log("Admin account already exists, skipping.");
	}

	const existingBlogCount = await prisma.blog.count();
	if (existingBlogCount === 0) {
		const blogsJsonPath = path.join(
			__dirname,
			"../../public/fakedata/blogs.json"
		);
		const blogs = JSON.parse(fs.readFileSync(blogsJsonPath, "utf8"));

		for (const blog of blogs) {
			await prisma.blog.create({
				data: {
					slug: blog.slug,
					title: blog.title,
					excerpt: blog.desc || "",
					content: [blog.desc1, blog.desc2].filter(Boolean).join("\n\n"),
					img: blog.img || "",
					category: blog.category || "",
					tags: JSON.stringify(blog.tags || []),
					author: blog.author || "",
					authorRole: blog.author_role || "",
					status: blog.status || "",
					published: true,
				},
			});
		}
		console.log(`Imported ${blogs.length} blog posts from blogs.json`);
	} else {
		console.log("Blogs already exist, skipping import.");
	}
}

main()
	.catch(e => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
```

- [ ] **Step 2: Run the seed script**

Run (from `backend/`):
```bash
npm run seed
```

Expected: prints `Created admin account for <your email>` and `Imported 9 blog posts from blogs.json`.

- [ ] **Step 3: Run it again to verify idempotency**

Run (from `backend/`):
```bash
npm run seed
```

Expected: prints `Admin account already exists, skipping.` and `Blogs already exist, skipping import.` — no duplicate rows.

- [ ] **Step 4: Verify row counts**

Run (from `backend/`):
```bash
node -e "const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); Promise.all([p.admin.count(),p.blog.count()]).then(([a,b])=>{console.log('admins:',a,'blogs:',b); process.exit(0)})"
```

Expected: `admins: 1 blogs: 9`.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/seed.js
git commit -m "Add seed script for admin account and blog import"
```

---

## Task 5: Public blogs routes

**Files:**
- Create: `backend/src/lib/prisma.js`
- Create: `backend/src/routes/blogs.js`
- Test: `backend/src/routes/blogs.test.js`

**Interfaces:**
- Consumes: `mapBlogToLegacyShape` (Task 2), `makePath` (Task 2).
- Produces: an Express router mounted later at `/api/blogs` with `GET /` (list, supports `?category=`, `?tag=`, `?author_role=`, `?search=`, mutually exclusive like the site's existing `filterItems`) and `GET /:slug` (single post, 404 if missing or unpublished).
- Consumed by: Task 11 (app wiring).

- [ ] **Step 1: Write `backend/src/lib/prisma.js`**

```js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
```

- [ ] **Step 2: Write the failing test**

Create `backend/src/routes/blogs.test.js`:

```js
const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");

const testDbPath = path.join(__dirname, "../../data/test-blogs.db");
process.env.DATABASE_URL = `file:${testDbPath}`;

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
const blogsRouter = require("./blogs");

function buildApp() {
	const app = express();
	app.use(express.json());
	app.use("/api/blogs", blogsRouter);
	return app;
}

test("lists published blogs, newest first, excluding drafts", async t => {
	await prisma.blog.create({
		data: {
			slug: "older-post",
			title: "Older Post",
			published: true,
			publishedAt: new Date("2025-01-01"),
		},
	});
	await prisma.blog.create({
		data: {
			slug: "newer-post",
			title: "Newer Post",
			published: true,
			publishedAt: new Date("2025-06-01"),
		},
	});
	await prisma.blog.create({
		data: {
			slug: "draft-post",
			title: "Draft Post",
			published: false,
			publishedAt: new Date("2025-07-01"),
		},
	});

	t.after(async () => {
		await prisma.blog.deleteMany();
	});

	const res = await request(buildApp()).get("/api/blogs");

	assert.equal(res.status, 200);
	assert.equal(res.body.blogs.length, 2);
	assert.equal(res.body.blogs[0].slug, "newer-post");
	assert.equal(res.body.blogs[1].slug, "older-post");
});

test("filters by category using the same normalization as the site", async t => {
	await prisma.blog.create({
		data: { slug: "corp-post", title: "Corp Post", category: "Corporate", published: true },
	});
	await prisma.blog.create({
		data: { slug: "biz-post", title: "Biz Post", category: "Business", published: true },
	});

	t.after(async () => {
		await prisma.blog.deleteMany();
	});

	const res = await request(buildApp()).get("/api/blogs?category=corporate");

	assert.equal(res.status, 200);
	assert.equal(res.body.blogs.length, 1);
	assert.equal(res.body.blogs[0].slug, "corp-post");
});

test("GET /api/blogs/:slug returns 404 for an unknown slug", async () => {
	const res = await request(buildApp()).get("/api/blogs/does-not-exist");
	assert.equal(res.status, 404);
});

test("GET /api/blogs/:slug returns the matching published blog", async t => {
	await prisma.blog.create({
		data: { slug: "findable-post", title: "Findable Post", published: true },
	});

	t.after(async () => {
		await prisma.blog.deleteMany();
	});

	const res = await request(buildApp()).get("/api/blogs/findable-post");

	assert.equal(res.status, 200);
	assert.equal(res.body.blog.title, "Findable Post");
});

test("GET /api/blogs/:slug returns 404 for an unpublished blog", async t => {
	await prisma.blog.create({
		data: { slug: "hidden-post", title: "Hidden Post", published: false },
	});

	t.after(async () => {
		await prisma.blog.deleteMany();
	});

	const res = await request(buildApp()).get("/api/blogs/hidden-post");

	assert.equal(res.status, 404);
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run (from `backend/`):
```bash
node --test src/routes/blogs.test.js
```

Expected: FAIL — `Cannot find module './blogs'`.

- [ ] **Step 4: Write `backend/src/routes/blogs.js`**

```js
const express = require("express");
const prisma = require("../lib/prisma");
const { mapBlogToLegacyShape } = require("../lib/adapter");
const makePath = require("../lib/makePath");

const router = express.Router();

router.get("/", async (req, res) => {
	const { category, tag, author_role: authorRole, search } = req.query;

	const blogs = await prisma.blog.findMany({
		where: { published: true },
		orderBy: { publishedAt: "desc" },
	});

	let mapped = blogs.map(mapBlogToLegacyShape);

	if (category) {
		mapped = mapped.filter(blog => makePath(blog.category) === category);
	} else if (tag) {
		const target = tag.toLowerCase();
		mapped = mapped.filter(blog =>
			blog.tags.map(t => t.toLowerCase()).includes(target)
		);
	} else if (authorRole) {
		mapped = mapped.filter(blog => makePath(blog.author_role) === authorRole);
	} else if (search) {
		const pattern = new RegExp(search, "i");
		mapped = mapped.filter(blog => pattern.test(blog.title));
	}

	res.json({ blogs: mapped });
});

router.get("/:slug", async (req, res) => {
	const blog = await prisma.blog.findUnique({
		where: { slug: req.params.slug },
	});

	if (!blog || !blog.published) {
		return res.status(404).json({ message: "Blog not found" });
	}

	res.json({ blog: mapBlogToLegacyShape(blog) });
});

module.exports = router;
```

- [ ] **Step 5: Run the test to verify it passes**

Run (from `backend/`):
```bash
node --test src/routes/blogs.test.js
```

Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add backend/src/lib/prisma.js backend/src/routes/blogs.js backend/src/routes/blogs.test.js
git commit -m "Add public GET /api/blogs and /api/blogs/:slug routes"
```

---

## Task 6: Best-effort mailer

**Files:**
- Create: `backend/src/lib/mailer.js`
- Test: `backend/src/lib/mailer.test.js`

**Interfaces:**
- Produces: `sendContactNotification({ name, email, phone, service, message })` — an async function that no-ops (resolves) when `SMTP_HOST`/`SMTP_USER` aren't set, and otherwise sends an email via Nodemailer.
- Consumed by: Task 7 (contact route).

- [ ] **Step 1: Write the failing test**

Create `backend/src/lib/mailer.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { sendContactNotification } = require("./mailer");

test("does not throw when SMTP is not configured", async () => {
	delete process.env.SMTP_HOST;
	delete process.env.SMTP_USER;

	await assert.doesNotReject(() =>
		sendContactNotification({
			name: "Test User",
			email: "test@example.com",
			message: "Hello",
		})
	);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run (from `backend/`):
```bash
node --test src/lib/mailer.test.js
```

Expected: FAIL — `Cannot find module './mailer'`.

- [ ] **Step 3: Write `backend/src/lib/mailer.js`**

```js
const nodemailer = require("nodemailer");

async function sendContactNotification({ name, email, phone, service, message }) {
	if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
		console.log("SMTP not configured, skipping contact notification email.");
		return;
	}

	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: Number(process.env.SMTP_PORT) || 587,
		secure: process.env.SMTP_SECURE === "true",
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
	});

	const toEmail = process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER;
	const fromEmail = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER;

	await transporter.sendMail({
		from: `"${name}" <${fromEmail}>`,
		replyTo: email,
		to: toEmail,
		subject: `New contact form submission${service ? ` - ${service}` : ""}`,
		text: [
			`Name: ${name}`,
			`Email: ${email}`,
			phone ? `Phone: ${phone}` : null,
			service ? `Service: ${service}` : null,
			"",
			message,
		]
			.filter(Boolean)
			.join("\n"),
	});
}

module.exports = { sendContactNotification };
```

- [ ] **Step 4: Run the test to verify it passes**

Run (from `backend/`):
```bash
node --test src/lib/mailer.test.js
```

Expected: PASS, 1 test.

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/mailer.js backend/src/lib/mailer.test.js
git commit -m "Add best-effort contact notification mailer"
```

---

## Task 7: Public contact route

**Files:**
- Create: `backend/src/routes/contact.js`
- Test: `backend/src/routes/contact.test.js`

**Interfaces:**
- Consumes: `sendContactNotification` (Task 6), `prisma` (Task 5).
- Produces: an Express router mounted later at `/api/contact` with `POST /` — validates input, always creates a `ContactSubmission` row, attempts email best-effort, responds `201 { message, id }`.
- Consumed by: Task 11 (app wiring).

- [ ] **Step 1: Write the failing test**

Create `backend/src/routes/contact.test.js`:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run (from `backend/`):
```bash
node --test src/routes/contact.test.js
```

Expected: FAIL — `Cannot find module './contact'`.

- [ ] **Step 3: Write `backend/src/routes/contact.js`**

```js
const express = require("express");
const prisma = require("../lib/prisma");
const { sendContactNotification } = require("../lib/mailer");

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/", async (req, res) => {
	const { name, email, phone, service, message } = req.body || {};

	if (!name || !email || !message) {
		return res
			.status(400)
			.json({ message: "Name, email and message are required." });
	}

	if (!emailPattern.test(email)) {
		return res
			.status(400)
			.json({ message: "Please provide a valid email address." });
	}

	const submission = await prisma.contactSubmission.create({
		data: { name, email, phone: phone || "", service: service || "", message },
	});

	try {
		await sendContactNotification({ name, email, phone, service, message });
	} catch (error) {
		console.error("Contact notification email failed to send:", error.message);
	}

	res.status(201).json({ message: "Message sent successfully.", id: submission.id });
});

module.exports = router;
```

- [ ] **Step 4: Run the test to verify it passes**

Run (from `backend/`):
```bash
node --test src/routes/contact.test.js
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/contact.js backend/src/routes/contact.test.js
git commit -m "Add public POST /api/contact route"
```

---

## Task 8: Admin auth routes

**Files:**
- Create: `backend/src/routes/adminAuth.js`
- Test: `backend/src/routes/adminAuth.test.js`

**Interfaces:**
- Consumes: `signAdminToken`, `verifyAdminToken`, `COOKIE_NAME` (Task 3), `prisma` (Task 5).
- Produces: an Express router mounted later at `/api/admin` with `POST /login`, `POST /logout`, `GET /me`.
- Consumed by: Task 11 (app wiring).

- [ ] **Step 1: Write the failing test**

Create `backend/src/routes/adminAuth.test.js`:

```js
const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");

const testDbPath = path.join(__dirname, "../../data/test-admin-auth.db");
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
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const adminAuthRouter = require("./adminAuth");
const { COOKIE_NAME } = require("../lib/auth");

function buildApp() {
	const app = express();
	app.use(express.json());
	app.use(cookieParser());
	app.use("/api/admin", adminAuthRouter);
	return app;
}

test("logs in with correct credentials and sets a cookie", async t => {
	const passwordHash = await bcrypt.hash("correct-password", 10);
	await prisma.admin.create({ data: { email: "admin@example.com", passwordHash } });

	t.after(async () => {
		await prisma.admin.deleteMany();
	});

	const res = await request(buildApp())
		.post("/api/admin/login")
		.send({ email: "admin@example.com", password: "correct-password" });

	assert.equal(res.status, 200);
	assert.ok(res.headers["set-cookie"]?.[0]?.includes(COOKIE_NAME));
});

test("rejects an incorrect password", async t => {
	const passwordHash = await bcrypt.hash("correct-password", 10);
	await prisma.admin.create({ data: { email: "admin2@example.com", passwordHash } });

	t.after(async () => {
		await prisma.admin.deleteMany();
	});

	const res = await request(buildApp())
		.post("/api/admin/login")
		.send({ email: "admin2@example.com", password: "wrong-password" });

	assert.equal(res.status, 401);
});

test("rejects an unknown email", async () => {
	const res = await request(buildApp())
		.post("/api/admin/login")
		.send({ email: "nobody@example.com", password: "whatever" });
	assert.equal(res.status, 401);
});

test("GET /me returns 401 with no cookie", async () => {
	const res = await request(buildApp()).get("/api/admin/me");
	assert.equal(res.status, 401);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run (from `backend/`):
```bash
node --test src/routes/adminAuth.test.js
```

Expected: FAIL — `Cannot find module './adminAuth'`.

- [ ] **Step 3: Write `backend/src/routes/adminAuth.js`**

```js
const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { signAdminToken, verifyAdminToken, COOKIE_NAME } = require("../lib/auth");

const router = express.Router();

function cookieOptions() {
	const isProduction = process.env.NODE_ENV === "production";
	return {
		httpOnly: true,
		sameSite: isProduction ? "none" : "lax",
		secure: isProduction,
		maxAge: 7 * 24 * 60 * 60 * 1000,
	};
}

router.post("/login", async (req, res) => {
	const { email, password } = req.body || {};

	if (!email || !password) {
		return res.status(400).json({ message: "Email and password are required." });
	}

	const admin = await prisma.admin.findUnique({ where: { email } });
	if (!admin) {
		return res.status(401).json({ message: "Invalid email or password." });
	}

	const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
	if (!passwordMatches) {
		return res.status(401).json({ message: "Invalid email or password." });
	}

	const token = signAdminToken(admin);
	res.cookie(COOKIE_NAME, token, cookieOptions());
	res.json({ email: admin.email });
});

router.post("/logout", (req, res) => {
	res.clearCookie(COOKIE_NAME, cookieOptions());
	res.json({ message: "Logged out." });
});

router.get("/me", (req, res) => {
	const token = req.cookies?.[COOKIE_NAME];
	const payload = token ? verifyAdminToken(token) : null;

	if (!payload) {
		return res.status(401).json({ message: "Not authenticated." });
	}

	res.json({ email: payload.email });
});

module.exports = router;
```

- [ ] **Step 4: Run the test to verify it passes**

Run (from `backend/`):
```bash
node --test src/routes/adminAuth.test.js
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/adminAuth.js backend/src/routes/adminAuth.test.js
git commit -m "Add admin login/logout/me routes"
```

---

## Task 9: Admin blogs CRUD routes

**Files:**
- Create: `backend/src/routes/adminBlogs.js`
- Test: `backend/src/routes/adminBlogs.test.js`

**Interfaces:**
- Consumes: `requireAdmin` (Task 3), `serializeAdminBlog` (Task 2), `signAdminToken`/`COOKIE_NAME` (Task 3, for tests only).
- Produces: an Express router mounted later at `/api/admin/blogs`, all routes behind `requireAdmin`: `GET /` (all blogs, including drafts), `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`.
- Consumed by: Task 11 (app wiring).

- [ ] **Step 1: Write the failing test**

Create `backend/src/routes/adminBlogs.test.js`:

```js
const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");

const testDbPath = path.join(__dirname, "../../data/test-admin-blogs.db");
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
const adminBlogsRouter = require("./adminBlogs");
const { signAdminToken, COOKIE_NAME } = require("../lib/auth");

function buildApp() {
	const app = express();
	app.use(express.json());
	app.use(cookieParser());
	app.use("/api/admin/blogs", adminBlogsRouter);
	return app;
}

function authCookie() {
	const token = signAdminToken({ id: 1, email: "admin@example.com" });
	return `${COOKIE_NAME}=${token}`;
}

test("rejects requests with no auth cookie", async () => {
	const res = await request(buildApp()).get("/api/admin/blogs");
	assert.equal(res.status, 401);
});

test("creates, lists, reads, updates and deletes a blog", async () => {
	const app = buildApp();

	const createRes = await request(app)
		.post("/api/admin/blogs")
		.set("Cookie", authCookie())
		.send({ title: "My New Post", slug: "my-new-post", excerpt: "Teaser" });

	assert.equal(createRes.status, 201);
	const createdId = createRes.body.blog.id;

	const listRes = await request(app)
		.get("/api/admin/blogs")
		.set("Cookie", authCookie());
	assert.equal(listRes.status, 200);
	assert.ok(listRes.body.blogs.some(b => b.id === createdId));

	const getRes = await request(app)
		.get(`/api/admin/blogs/${createdId}`)
		.set("Cookie", authCookie());
	assert.equal(getRes.status, 200);
	assert.equal(getRes.body.blog.title, "My New Post");

	const updateRes = await request(app)
		.put(`/api/admin/blogs/${createdId}`)
		.set("Cookie", authCookie())
		.send({ title: "Updated Title" });
	assert.equal(updateRes.status, 200);
	assert.equal(updateRes.body.blog.title, "Updated Title");

	const deleteRes = await request(app)
		.delete(`/api/admin/blogs/${createdId}`)
		.set("Cookie", authCookie());
	assert.equal(deleteRes.status, 200);

	const afterDeleteRes = await request(app)
		.get(`/api/admin/blogs/${createdId}`)
		.set("Cookie", authCookie());
	assert.equal(afterDeleteRes.status, 404);
});

test("rejects creating a blog with a duplicate slug", async t => {
	const app = buildApp();

	await prisma.blog.create({ data: { title: "Existing", slug: "existing-slug" } });
	t.after(async () => {
		await prisma.blog.deleteMany();
	});

	const res = await request(app)
		.post("/api/admin/blogs")
		.set("Cookie", authCookie())
		.send({ title: "Duplicate", slug: "existing-slug" });

	assert.equal(res.status, 400);
});

test("GET /api/admin/blogs includes unpublished drafts", async t => {
	await prisma.blog.create({
		data: { title: "Draft", slug: "draft-post", published: false },
	});
	t.after(async () => {
		await prisma.blog.deleteMany();
	});

	const res = await request(buildApp())
		.get("/api/admin/blogs")
		.set("Cookie", authCookie());

	assert.equal(res.status, 200);
	assert.ok(res.body.blogs.some(b => b.slug === "draft-post"));
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run (from `backend/`):
```bash
node --test src/routes/adminBlogs.test.js
```

Expected: FAIL — `Cannot find module './adminBlogs'`.

- [ ] **Step 3: Write `backend/src/routes/adminBlogs.js`**

```js
const express = require("express");
const prisma = require("../lib/prisma");
const requireAdmin = require("../middleware/requireAdmin");
const { serializeAdminBlog } = require("../lib/adapter");

const router = express.Router();

router.use(requireAdmin);

router.get("/", async (req, res) => {
	const blogs = await prisma.blog.findMany({ orderBy: { publishedAt: "desc" } });
	res.json({ blogs: blogs.map(serializeAdminBlog) });
});

router.get("/:id", async (req, res) => {
	const blog = await prisma.blog.findUnique({ where: { id: Number(req.params.id) } });

	if (!blog) {
		return res.status(404).json({ message: "Blog not found." });
	}

	res.json({ blog: serializeAdminBlog(blog) });
});

router.post("/", async (req, res) => {
	const {
		title,
		slug,
		excerpt,
		content,
		img,
		category,
		tags,
		author,
		authorRole,
		status,
		published,
	} = req.body || {};

	if (!title || !slug) {
		return res.status(400).json({ message: "Title and slug are required." });
	}

	const existing = await prisma.blog.findUnique({ where: { slug } });
	if (existing) {
		return res.status(400).json({ message: "A blog with this slug already exists." });
	}

	const blog = await prisma.blog.create({
		data: {
			title,
			slug,
			excerpt: excerpt || "",
			content: content || "",
			img: img || "",
			category: category || "",
			tags: JSON.stringify(tags || []),
			author: author || "",
			authorRole: authorRole || "",
			status: status || "",
			published: published !== undefined ? published : true,
		},
	});

	res.status(201).json({ blog: serializeAdminBlog(blog) });
});

router.put("/:id", async (req, res) => {
	const id = Number(req.params.id);
	const existing = await prisma.blog.findUnique({ where: { id } });

	if (!existing) {
		return res.status(404).json({ message: "Blog not found." });
	}

	const {
		title,
		slug,
		excerpt,
		content,
		img,
		category,
		tags,
		author,
		authorRole,
		status,
		published,
	} = req.body || {};

	if (slug && slug !== existing.slug) {
		const slugTaken = await prisma.blog.findUnique({ where: { slug } });
		if (slugTaken) {
			return res.status(400).json({ message: "A blog with this slug already exists." });
		}
	}

	const blog = await prisma.blog.update({
		where: { id },
		data: {
			title: title ?? existing.title,
			slug: slug ?? existing.slug,
			excerpt: excerpt ?? existing.excerpt,
			content: content ?? existing.content,
			img: img ?? existing.img,
			category: category ?? existing.category,
			tags: tags !== undefined ? JSON.stringify(tags) : existing.tags,
			author: author ?? existing.author,
			authorRole: authorRole ?? existing.authorRole,
			status: status ?? existing.status,
			published: published !== undefined ? published : existing.published,
		},
	});

	res.json({ blog: serializeAdminBlog(blog) });
});

router.delete("/:id", async (req, res) => {
	const id = Number(req.params.id);
	const existing = await prisma.blog.findUnique({ where: { id } });

	if (!existing) {
		return res.status(404).json({ message: "Blog not found." });
	}

	await prisma.blog.delete({ where: { id } });
	res.json({ message: "Blog deleted." });
});

module.exports = router;
```

- [ ] **Step 4: Run the test to verify it passes**

Run (from `backend/`):
```bash
node --test src/routes/adminBlogs.test.js
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/adminBlogs.js backend/src/routes/adminBlogs.test.js
git commit -m "Add admin blogs CRUD routes"
```

---

## Task 10: Admin messages routes

**Files:**
- Create: `backend/src/routes/adminMessages.js`
- Test: `backend/src/routes/adminMessages.test.js`

**Interfaces:**
- Consumes: `requireAdmin` (Task 3).
- Produces: an Express router mounted later at `/api/admin/messages`, behind `requireAdmin`: `GET /` (all submissions, newest first), `PATCH /:id` (set `status` to `"read"` or `"new"`).
- Consumed by: Task 11 (app wiring).

- [ ] **Step 1: Write the failing test**

Create `backend/src/routes/adminMessages.test.js`:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run (from `backend/`):
```bash
node --test src/routes/adminMessages.test.js
```

Expected: FAIL — `Cannot find module './adminMessages'`.

- [ ] **Step 3: Write `backend/src/routes/adminMessages.js`**

```js
const express = require("express");
const prisma = require("../lib/prisma");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.use(requireAdmin);

router.get("/", async (req, res) => {
	const messages = await prisma.contactSubmission.findMany({
		orderBy: { createdAt: "desc" },
	});
	res.json({ messages });
});

router.patch("/:id", async (req, res) => {
	const id = Number(req.params.id);
	const existing = await prisma.contactSubmission.findUnique({ where: { id } });

	if (!existing) {
		return res.status(404).json({ message: "Submission not found." });
	}

	const { status } = req.body || {};
	const nextStatus = status === "new" ? "new" : "read";

	const message = await prisma.contactSubmission.update({
		where: { id },
		data: { status: nextStatus },
	});

	res.json({ message });
});

module.exports = router;
```

- [ ] **Step 4: Run the test to verify it passes**

Run (from `backend/`):
```bash
node --test src/routes/adminMessages.test.js
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/adminMessages.js backend/src/routes/adminMessages.test.js
git commit -m "Add admin messages routes"
```

---

## Task 11: Wire the Express app and server

**Files:**
- Create: `backend/src/app.js`
- Create: `backend/src/server.js`
- Modify: `README.md:1` (append a "Running the full stack locally" section — see Task 25, this task only touches backend files)

**Interfaces:**
- Consumes: every router from Tasks 5, 7, 8, 9, 10.
- Produces: `buildApp()` (exported from `app.js`, returns a configured Express app — used directly by tests in earlier tasks... note: earlier task tests build their own minimal apps per-router, this `buildApp` is for the real running server) and the actual running server via `server.js`.

- [ ] **Step 1: Write `backend/src/app.js`**

```js
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const blogsRouter = require("./routes/blogs");
const contactRouter = require("./routes/contact");
const adminAuthRouter = require("./routes/adminAuth");
const adminBlogsRouter = require("./routes/adminBlogs");
const adminMessagesRouter = require("./routes/adminMessages");

function buildApp() {
	const app = express();

	app.use(
		cors({
			origin: process.env.CORS_ORIGIN || "http://localhost:3001",
			credentials: true,
		})
	);
	app.use(express.json());
	app.use(cookieParser());

	app.get("/health", (req, res) => res.json({ ok: true }));

	app.use("/api/blogs", blogsRouter);
	app.use("/api/contact", contactRouter);
	app.use("/api/admin", adminAuthRouter);
	app.use("/api/admin/blogs", adminBlogsRouter);
	app.use("/api/admin/messages", adminMessagesRouter);

	app.use((err, req, res, next) => {
		console.error(err);
		res.status(500).json({ message: "Something went wrong." });
	});

	return app;
}

module.exports = buildApp;
```

- [ ] **Step 2: Write `backend/src/server.js`**

```js
require("dotenv").config();
const buildApp = require("./app");

const app = buildApp();
const port = process.env.PORT || 5000;

app.listen(port, () => {
	console.log(`Backend listening on http://localhost:${port}`);
});
```

- [ ] **Step 3: Run the full test suite**

Run (from `backend/`):
```bash
npm test
```

Expected: all test files pass (adapter, requireAdmin, blogs, mailer, contact, adminAuth, adminBlogs, adminMessages).

- [ ] **Step 4: Start the server and smoke-test it manually**

Run (from `backend/`):
```bash
npm run dev
```

In another terminal:
```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/blogs
```

Expected: `{"ok":true}`, then a JSON list of the 9 seeded blogs (from Task 4's seed run). Stop the server with Ctrl+C when done.

- [ ] **Step 5: Commit**

```bash
git add backend/src/app.js backend/src/server.js
git commit -m "Wire Express app and server entrypoint"
```

---

## Task 12: Site helper — `blogsApi.js` (backend-first with local fallback)

**Files:**
- Create: `src/libs/blogsApi.js`
- Test: `src/libs/blogsApi.test.js`

**Interfaces:**
- Produces: `getBlogsFromBackend(filters = {})` → `Promise<Array>`, `getBlogFromBackendBySlug(slug)` → `Promise<Object|null>`. Both try the backend first (`process.env.BACKEND_URL`, default `http://localhost:5000`) and fall back to reading `public/fakedata/blogs.json` directly on any failure.
- Consumed by: Task 13 (API proxy routes), Task 15 (blog detail page + BlogDetailsMain).

Important: this file deliberately does **not** import the existing `src/libs/getBlogs.js` or `src/libs/filterItems.js`. Those are written with ES-module syntax (`import`/`export default`) with no file extension on their own relative imports — Next.js's bundler transpiles that fine, but this file needs to run under plain Node (via `node --test`, with no bundler) for its own test, and plain Node's CommonJS loader cannot parse `import`/`export` syntax. So the fallback path here reads and filters `blogs.json` itself, using only Node built-ins (`fs`, `path`) — self-contained, no cross-module-system issues, and the two existing files stay untouched.

This is the one new piece of testable logic on the site side — everything else in Phase B is routing/rendering glue, verified by running the app (consistent with the rest of this codebase, which has no existing test setup for UI code).

- [ ] **Step 1: Add a test script to the site's `package.json`**

Edit `package.json` at the repo root, add to `"scripts"`:

```json
"test": "node --test src/libs/**/*.test.js",
```

- [ ] **Step 2: Write the failing test**

Create `src/libs/blogsApi.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert/strict");

test("getBlogsFromBackend falls back to local data when the backend is unreachable", async () => {
	const originalFetch = global.fetch;
	global.fetch = async () => {
		throw new Error("network error");
	};

	try {
		const { getBlogsFromBackend } = require("./blogsApi");
		const blogs = await getBlogsFromBackend();
		assert.ok(Array.isArray(blogs));
		assert.ok(blogs.length > 0);
	} finally {
		global.fetch = originalFetch;
	}
});

test("getBlogFromBackendBySlug falls back to local data by slug", async () => {
	const originalFetch = global.fetch;
	global.fetch = async () => {
		throw new Error("network error");
	};

	try {
		const { getBlogFromBackendBySlug } = require("./blogsApi");
		const blog = await getBlogFromBackendBySlug(
			"innovative-solutions-for-every-business-success"
		);
		assert.ok(blog);
		assert.equal(blog.slug, "innovative-solutions-for-every-business-success");
	} finally {
		global.fetch = originalFetch;
	}
});

test("getBlogFromBackendBySlug returns null when the slug doesn't exist locally either", async () => {
	const originalFetch = global.fetch;
	global.fetch = async () => {
		throw new Error("network error");
	};

	try {
		const { getBlogFromBackendBySlug } = require("./blogsApi");
		const blog = await getBlogFromBackendBySlug("this-slug-does-not-exist");
		assert.equal(blog, null);
	} finally {
		global.fetch = originalFetch;
	}
});
```

This test relies on `public/fakedata/blogs.json` still containing the slug `innovative-solutions-for-every-business-success` (added in an earlier session) — it does, and Task 4's seed script reads the same file, so this also doubles as a check that the file hasn't drifted.

- [ ] **Step 3: Run the test to verify it fails**

Run (from the repo root):
```bash
node --test src/libs/blogsApi.test.js
```

Expected: FAIL — `Cannot find module './blogsApi'`.

- [ ] **Step 4: Write `src/libs/blogsApi.js`**

```js
const fs = require("fs");
const path = require("path");

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

function makePath(text) {
	if (!text) return "#";
	const normalized = text.toLowerCase().split("/").join(" ").split("&").join(" ");
	return normalized.split(" ").join("_");
}

function readLocalBlogs() {
	const blogsJsonPath = path.join(process.cwd(), "public/fakedata/blogs.json");
	return JSON.parse(fs.readFileSync(blogsJsonPath, "utf8"));
}

function localFilteredBlogs({ category, tag, author_role, search } = {}) {
	const items = readLocalBlogs();

	if (category) {
		return items.filter(item => makePath(item.category) === category);
	}
	if (tag) {
		const target = tag.toLowerCase();
		return items.filter(item =>
			item.tags?.map(t => t.toLowerCase()).includes(target)
		);
	}
	if (author_role) {
		return items.filter(item => makePath(item.author_role) === author_role);
	}
	if (search) {
		const pattern = new RegExp(search, "i");
		return items.filter(item => pattern.test(item.title));
	}
	return items;
}

async function getBlogsFromBackend(filters = {}) {
	const params = new URLSearchParams();
	Object.entries(filters).forEach(([key, value]) => {
		if (value) params.set(key, value);
	});
	const queryString = params.toString();

	try {
		const res = await fetch(
			`${BACKEND_URL}/api/blogs${queryString ? `?${queryString}` : ""}`,
			{ cache: "no-store" }
		);
		if (!res.ok) throw new Error(`Backend responded with ${res.status}`);
		const data = await res.json();
		return data.blogs || [];
	} catch (error) {
		console.error("Falling back to local blog data:", error.message);
		return localFilteredBlogs(filters);
	}
}

async function getBlogFromBackendBySlug(slug) {
	try {
		const res = await fetch(`${BACKEND_URL}/api/blogs/${slug}`, {
			cache: "no-store",
		});
		if (res.status === 404) return null;
		if (!res.ok) throw new Error(`Backend responded with ${res.status}`);
		const data = await res.json();
		return data.blog || null;
	} catch (error) {
		console.error("Falling back to local blog data:", error.message);
		const items = readLocalBlogs();
		return items.find(item => item.slug === slug) || null;
	}
}

module.exports = { getBlogsFromBackend, getBlogFromBackendBySlug };
```

Note on the query-param names here (`category`, `tag`, `author_role`, `search`): these intentionally use the site's existing snake_case convention (matching `filterItems.js` and the URL params `BlogMain.js` already reads), not the camelCase used on the Prisma/admin side — `mapBlogToLegacyShape` (Task 2) is the seam where the backend's camelCase (`authorRole`) becomes the site's snake_case (`author_role`) on the way out.

- [ ] **Step 5: Run the test to verify it passes**

Run (from the repo root):
```bash
node --test src/libs/blogsApi.test.js
```

Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add package.json src/libs/blogsApi.js src/libs/blogsApi.test.js
git commit -m "Add blogsApi helper: backend-first, falls back to local blogs.json"
```

---

## Task 13: Site API routes become proxies to the backend

**Files:**
- Modify: `src/app/api/blogs/route.js` (currently reads `getBlogs()` + `filterItems` directly)
- Modify: `src/app/api/blogs/[slug]/route.js` (currently reads `getBlogs()` directly)

**Interfaces:**
- Consumes: `getBlogsFromBackend`, `getBlogFromBackendBySlug` (Task 12).

- [ ] **Step 1: Rewrite `src/app/api/blogs/route.js`**

```js
import { getBlogsFromBackend } from "@/libs/blogsApi";
import { NextResponse } from "next/server";

export async function GET(request) {
	const { searchParams } = new URL(request.url);

	const blogs = await getBlogsFromBackend({
		category: searchParams.get("category"),
		tag: searchParams.get("tag"),
		author_role: searchParams.get("author_role"),
		search: searchParams.get("search"),
	});

	return NextResponse.json({ blogs });
}
```

- [ ] **Step 2: Rewrite `src/app/api/blogs/[slug]/route.js`**

```js
import { getBlogFromBackendBySlug } from "@/libs/blogsApi";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
	const { slug } = await params;
	const blog = await getBlogFromBackendBySlug(slug);

	if (!blog) {
		return NextResponse.json({ message: "Blog not found" }, { status: 404 });
	}

	return NextResponse.json({ blog });
}
```

- [ ] **Step 3: Manually verify against the fallback path (backend not running yet)**

Run (from the repo root, in one terminal):
```bash
npm run dev
```

In another terminal:
```bash
curl http://localhost:4000/api/blogs
curl http://localhost:4000/api/blogs/innovative-solutions-for-every-business-success
```

Expected: both return the same JSON shapes as before (backend isn't running yet, so this exercises the fallback path in `blogsApi.js`). Leave the dev server running for the next tasks, or stop it with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/blogs/route.js" "src/app/api/blogs/[slug]/route.js"
git commit -m "Turn site's blogs API routes into backend proxies with local fallback"
```

---

## Task 14: Site contact route proxies to the backend

**Files:**
- Modify: `src/app/api/contact/route.js` (currently sends email directly via Nodemailer)
- Modify: `package.json:15-34` (remove the now-unused `nodemailer` dependency)
- Delete: `.env.example` SMTP entries are superseded by `backend/.env.example` — leave the file as-is, no action needed here (it documents the site's own env vars, which now only needs `BACKEND_URL`, added in Task 18)

**Interfaces:**
- Produces: `POST /api/contact` on the site now forwards to `${BACKEND_URL}/api/contact` and relays its response/status.

- [ ] **Step 1: Rewrite `src/app/api/contact/route.js`**

```js
import { NextResponse } from "next/server";

export async function POST(request) {
	const body = await request.json();
	const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

	try {
		const res = await fetch(`${backendUrl}/api/contact`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		const data = await res.json();
		return NextResponse.json(data, { status: res.status });
	} catch (error) {
		console.error("Failed to reach backend for contact submission:", error.message);
		return NextResponse.json(
			{ message: "Failed to send message. Please try again later." },
			{ status: 500 }
		);
	}
}
```

- [ ] **Step 2: Remove the unused `nodemailer` dependency from the site**

Run (from the repo root):
```bash
npm uninstall nodemailer
```

- [ ] **Step 3: Manually verify (backend not running yet — expect a graceful 500)**

With the site's dev server running (`npm run dev` from Task 13, Step 3):
```bash
curl -X POST http://localhost:4000/api/contact -H "Content-Type: application/json" -d "{\"name\":\"Test\",\"email\":\"test@example.com\",\"message\":\"Hi\"}"
```

Expected: `{"message":"Failed to send message. Please try again later."}` with status 500 (the backend isn't running yet — this will succeed once Task 18's end-to-end check runs with the backend up).

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/contact/route.js" package.json package-lock.json
git commit -m "Proxy site's contact route to the backend; remove now-unused nodemailer"
```

---

## Task 15: Blog detail page and BlogDetailsMain use the backend

**Files:**
- Modify: `src/app/blogs/[slug]/page.js` (currently reads `getBlogs()` synchronously at module scope)
- Modify: `src/components/layout/main/BlogDetailsMain.js` (currently reads `getBlogs()` synchronously)

**Interfaces:**
- Consumes: `getBlogsFromBackend`, `getBlogFromBackendBySlug` (Task 12).

- [ ] **Step 1: Rewrite `src/app/blogs/[slug]/page.js`**

```js
import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";
import BlogDetailsMain from "@/components/layout/main/BlogDetailsMain";
import Cta from "@/components/sections/cta/Cta";
import BackToTop from "@/components/shared/others/BackToTop";
import HeaderSpace from "@/components/shared/others/HeaderSpace";
import ClientWrapper from "@/components/shared/wrappers/ClientWrapper";
import { getBlogFromBackendBySlug, getBlogsFromBackend } from "@/libs/blogsApi";
import { notFound } from "next/navigation";

export default async function BlogDetails({ params }) {
	const { slug } = await params;
	const blog = await getBlogFromBackendBySlug(slug);

	if (!blog) {
		notFound();
	}

	return (
		<div>
			<BackToTop />
			<Header />
			<Header isStickyHeader={true} />
			<div id="smooth-wrapper">
				<div id="smooth-content">
					<main>
						<HeaderSpace />
						<BlogDetailsMain currentSlug={slug} />
						<Cta />
					</main>
					<Footer />
				</div>
			</div>
			<ClientWrapper />
		</div>
	);
}

export async function generateStaticParams() {
	const items = await getBlogsFromBackend();
	return items?.map(({ slug }) => ({ slug }));
}
```

- [ ] **Step 2: Rewrite `src/components/layout/main/BlogDetailsMain.js`**

```js
import BlogDetailsPrimary from "@/components/sections/blogs/BlogDetailsPrimary";
import HeroInner from "@/components/sections/hero/HeroInner";
import { getBlogsFromBackend } from "@/libs/blogsApi";
import getPreviousNextItem from "@/libs/getPreviousNextItem";

const BlogDetailsMain = async ({ currentSlug }) => {
	const items = await getBlogsFromBackend();
	const currentId = items?.find(({ slug }) => slug === currentSlug)?.id;
	const option = getPreviousNextItem(items, currentId);
	const { title } = option?.currentItem || {};
	const prevSlug = items?.find(({ id }) => id === option?.prevId)?.slug;
	const nextSlug = items?.find(({ id }) => id === option?.nextId)?.slug;

	return (
		<div>
			<HeroInner
				title={"Blog Details"}
				text={title ? title : "Blog Details"}
				breadcrums={[{ name: "Blogs", path: "/blogs" }]}
			/>
			<BlogDetailsPrimary option={{ ...option, prevSlug, nextSlug }} />
		</div>
	);
};

export default BlogDetailsMain;
```

- [ ] **Step 3: Manually verify (backend still not running — fallback path)**

With the dev server running:
```bash
curl -o /dev/null -w "%{http_code}\n" http://localhost:4000/blogs/innovative-solutions-for-every-business-success
curl -o /dev/null -w "%{http_code}\n" http://localhost:4000/blogs/this-does-not-exist
```

Expected: `200` for the real slug, `404` content for the fake one (same as before — this still runs on the local fallback data since the backend isn't up yet).

- [ ] **Step 4: Commit**

```bash
git add "src/app/blogs/[slug]/page.js" src/components/layout/main/BlogDetailsMain.js
git commit -m "Blog detail page and BlogDetailsMain fetch from the backend"
```

---

## Task 16: BlogMain fetches client-side through the site's own API

**Files:**
- Modify: `src/components/layout/main/BlogMain.js` (currently `useMemo(() => getBlogs())`, synchronous)

**Interfaces:**
- Consumes: the site's own `/api/blogs` route (Task 13) via relative `fetch` — same-origin, no CORS needed.

- [ ] **Step 1: Rewrite `src/components/layout/main/BlogMain.js`**

```js
"use client";
import BlogsPrimary from "@/components/sections/blogs/BlogsPrimary";
import HeroInner from "@/components/sections/hero/HeroInner";
import makeText from "@/libs/makeText";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const BlogMain = () => {
	const [filteredItems, setFilteredItems] = useState([]);
	const category = useSearchParams()?.get("category");
	const tag = useSearchParams()?.get("tag");
	const author_role = useSearchParams()?.get("author_role");
	const search = useSearchParams()?.get("search");

	useEffect(() => {
		const params = new URLSearchParams();
		if (category) params.set("category", category);
		if (tag) params.set("tag", tag);
		if (author_role) params.set("author_role", author_role);
		if (search) params.set("search", search);

		fetch(`/api/blogs?${params.toString()}`)
			.then(res => res.json())
			.then(data => setFilteredItems(data?.blogs || []))
			.catch(() => setFilteredItems([]));
	}, [category, tag, author_role, search]);

	return (
		<div>
			<HeroInner
				title={
					category
						? `Category: ${makeText(category, true)}`
						: tag
						? `Tag: ${makeText(tag, true)}`
						: author_role
						? author_role
						: search
						? makeText(search, true)
						: "Read Blog"
				}
				text={
					category
						? `${makeText(category, true)}`
						: tag
						? ` ${makeText(tag, true)}`
						: author_role
						? `${author_role}`
						: search
						? `${makeText(search, true)}`
						: "Blogs"
				}
				breadcrums={
					category || tag || author_role || search
						? [{ name: "Blogs", path: "/blogs" }]
						: []
				}
			/>
			<BlogsPrimary filteredItems={filteredItems} />
		</div>
	);
};

export default BlogMain;
```

- [ ] **Step 2: Manually verify**

With the dev server running, open `http://localhost:4000/blogs` in a browser (or `curl http://localhost:4000/blogs`). Expected: the page renders the same 9 posts as before (via the fallback path — backend still not running).

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/main/BlogMain.js
git commit -m "BlogMain fetches blogs client-side through the site's own API route"
```

---

## Task 17: Fix BlogDetailsPrimary to render real post content

**Files:**
- Modify: `src/components/sections/blogs/BlogDetailsPrimary.js:8-11,67-86`

**Interfaces:**
- Consumes: `content` field now present on `currentItem` (via `mapBlogToLegacyShape`, Task 2, or absent for locally-sourced fallback posts, which is expected — see below).

Scope note: this task fixes the two intro paragraphs that were previously hardcoded lorem-ipsum text for every post, replacing them with the real post `content` when present. The blockquote, "Key lessons" section, image gallery, checklist, video embed, and "Conclusions" heading further down the page stay as fixed template decoration — turning those into fully admin-authored content would need a rich content-block model that wasn't part of this round's scope.

- [ ] **Step 1: Update the destructuring at the top of the component**

In `src/components/sections/blogs/BlogDetailsPrimary.js`, change:

```js
	const { prevSlug, nextSlug, currentItem, isPrevItem, isNextItem } =
		option || {};
	const { title, img, tags, slug } = currentItem || {};
```

to:

```js
	const { prevSlug, nextSlug, currentItem, isPrevItem, isNextItem } =
		option || {};
	const { title, img, tags, slug, content } = currentItem || {};
	const contentParagraphs = content
		?.split(/\n{2,}/)
		?.map(paragraph => paragraph.trim())
		?.filter(Boolean);
```

- [ ] **Step 2: Replace the two hardcoded intro paragraphs**

Change:

```jsx
							<div className="blog-text">
								<p className="wow fadeInUp" data-wow-delay=".3s">
									In today’s competitive landscape, businesses must continuously
									adapt and innovate to thrive. Unlocking Business Potential
									means identifying untapped opportunities and leveraging
									innovative solutions to drive growth, enhance efficiency, and
									foster lasting success. At [Company Name], we believe that
									success is not just about working harder—it's about working
									smarter. By harnessing cutting-edge technologies, data-driven
									insights, and creative problem-solving, we provide businesses
									with the tools and strategies needed to stay ahead.
								</p>
								<p className="wow fadeInUp" data-wow-delay=".3s">
									The curve. Whether you're looking to streamline operations,
									enhance customer experiences, or explore new market
									opportunities, our tailored solutions are designed to empower
									your business to achieve unparalleled success. With a focus on
									sustainability, scalability, and adaptability, we help your
									business.
								</p>
```

to:

```jsx
							<div className="blog-text">
								{contentParagraphs?.length ? (
									contentParagraphs.map((paragraph, idx) => (
										<p key={idx} className="wow fadeInUp" data-wow-delay=".3s">
											{paragraph}
										</p>
									))
								) : (
									<>
										<p className="wow fadeInUp" data-wow-delay=".3s">
											In today’s competitive landscape, businesses must continuously
											adapt and innovate to thrive. Unlocking Business Potential
											means identifying untapped opportunities and leveraging
											innovative solutions to drive growth, enhance efficiency, and
											foster lasting success. At [Company Name], we believe that
											success is not just about working harder—it's about working
											smarter. By harnessing cutting-edge technologies, data-driven
											insights, and creative problem-solving, we provide businesses
											with the tools and strategies needed to stay ahead.
										</p>
										<p className="wow fadeInUp" data-wow-delay=".3s">
											The curve. Whether you're looking to streamline operations,
											enhance customer experiences, or explore new market
											opportunities, our tailored solutions are designed to empower
											your business to achieve unparalleled success. With a focus on
											sustainability, scalability, and adaptability, we help your
											business.
										</p>
									</>
								)}
```

Leave everything from the `<blockquote>` onward (through the end of the `.blog-text` div) exactly as it is.

- [ ] **Step 3: Manually verify**

With the dev server running, open `http://localhost:4000/blogs/innovative-solutions-for-every-business-success`. Expected: page renders fine, intro paragraphs still show (falling back to the original hardcoded text, since fallback posts from `blogs.json` have no `content` field) — this confirms the fallback branch works and nothing broke. Once the backend is seeded and running (Task 18), the same page will show the seeded post's actual `desc1`/`desc2` text imported into `content` by the seed script.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/blogs/BlogDetailsPrimary.js
git commit -m "Render real post content on the blog detail page, with a fallback"
```

---

## Task 18: Site env var + full backend-connected integration check

**Files:**
- Modify: `.env.example` (repo root — add `BACKEND_URL`, remove the now-unused `SMTP_*`/`CONTACT_*` entries)

**Interfaces:** none — this task wires the last env var and proves Phase B end-to-end with the real backend running.

- [ ] **Step 1: Update the site's `.env.example`**

Replace its contents with:

```
# URL of the backend service (see backend/README or backend/.env.example)
BACKEND_URL=http://localhost:5000
```

- [ ] **Step 2: Create your local `.env.local`**

Run (from the repo root):
```bash
cp .env.example .env.local
```

- [ ] **Step 3: Start all the pieces and re-run the earlier fallback checks against the real backend**

In one terminal (from `backend/`): `npm run dev` (make sure Tasks 1-11 were completed, so the DB is migrated and seeded).
In another terminal (from the repo root): `npm run dev`.

Then:
```bash
curl http://localhost:4000/api/blogs
curl http://localhost:4000/blogs/innovative-solutions-for-every-business-success
curl -X POST http://localhost:4000/api/contact -H "Content-Type: application/json" -d "{\"name\":\"Test\",\"email\":\"test@example.com\",\"message\":\"Hi\"}"
```

Expected: `/api/blogs` returns the 9 seeded posts from the backend (not the fallback); the blog detail page returns 200; the contact POST now returns `201 {"message":"Message sent successfully.","id":...}` (routed through the backend, which saved it — check with `curl http://localhost:5000/api/admin/blogs` failing with 401 is expected since that's an admin-only route; the important check is the 201 on `/api/contact`).

- [ ] **Step 4: Commit**

```bash
git add .env.example
git commit -m "Add BACKEND_URL to the site's env vars"
```

---

## Task 19: Admin app scaffold

**Files:**
- Create: `admin/package.json`
- Create: `admin/jsconfig.json`
- Create: `admin/next.config.js`
- Create: `admin/.gitignore`
- Create: `admin/.env.example`
- Create: `admin/src/app/layout.js`
- Create: `admin/src/app/globals.css`
- Create: `admin/src/app/page.js`

**Interfaces:**
- Produces: a runnable (empty) Next.js app on port 3001.

- [ ] **Step 1: Create the folder and `package.json`**

Run (from the repo root):
```bash
mkdir -p admin/src/app
```

Create `admin/package.json`:

```json
{
	"name": "bexon-admin",
	"version": "0.1.0",
	"private": true,
	"scripts": {
		"dev": "next dev --turbopack -p 3001",
		"build": "next build --turbopack",
		"start": "next start -p 3001"
	},
	"dependencies": {
		"next": "^16.2.9",
		"react": "^19.2.7",
		"react-dom": "^19.2.7"
	}
}
```

- [ ] **Step 2: Install dependencies**

Run (from `admin/`):
```bash
npm install
```

- [ ] **Step 3: Create `admin/jsconfig.json`**

```json
{
	"compilerOptions": {
		"paths": {
			"@/*": ["./src/*"]
		}
	}
}
```

- [ ] **Step 4: Create `admin/next.config.js`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
};

module.exports = nextConfig;
```

- [ ] **Step 5: Create `admin/.gitignore`**

```
node_modules
.next
.env.local
```

- [ ] **Step 6: Create `admin/.env.example`**

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

Then run (from `admin/`):
```bash
cp .env.example .env.local
```

- [ ] **Step 7: Create `admin/src/app/globals.css`**

```css
* {
	box-sizing: border-box;
}

body {
	margin: 0;
	font-family: system-ui, -apple-system, sans-serif;
	background: #f5f6f8;
	color: #1a1a1a;
}

.page {
	max-width: 960px;
	margin: 0 auto;
	padding: 24px 16px;
}

.page-narrow {
	max-width: 400px;
}

.page-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 16px;
}

.nav {
	display: flex;
	gap: 16px;
	align-items: center;
	margin-bottom: 24px;
	padding-bottom: 12px;
	border-bottom: 1px solid #ddd;
}

.nav a {
	color: #1a1a1a;
	text-decoration: none;
	font-weight: 600;
}

.form {
	display: flex;
	flex-direction: column;
	gap: 12px;
	max-width: 640px;
}

.form-field {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.form-field-checkbox {
	flex-direction: row;
	align-items: center;
}

.form-field label {
	font-weight: 600;
	font-size: 14px;
}

.form-field input,
.form-field textarea {
	padding: 8px;
	border: 1px solid #ccc;
	border-radius: 4px;
	font-size: 14px;
}

.button {
	display: inline-block;
	padding: 10px 20px;
	background: #02092c;
	color: #fff;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 14px;
	text-decoration: none;
	width: fit-content;
}

.button:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.button-link {
	background: none;
	border: none;
	color: #b91c1c;
	cursor: pointer;
	padding: 0;
	font-size: 14px;
	text-decoration: underline;
}

.error {
	color: #b91c1c;
	font-size: 14px;
}

.table {
	width: 100%;
	border-collapse: collapse;
}

.table th,
.table td {
	text-align: left;
	padding: 8px;
	border-bottom: 1px solid #ddd;
	font-size: 14px;
}
```

- [ ] **Step 8: Create `admin/src/app/layout.js`**

```js
import "./globals.css";

export const metadata = {
	title: "Bexon Admin",
	description: "Manage blog posts and contact submissions.",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
```

- [ ] **Step 9: Create `admin/src/app/page.js`**

```js
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminHome() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/blogs");
	}, [router]);

	return null;
}
```

- [ ] **Step 10: Verify it runs**

Run (from `admin/`):
```bash
npm run dev
```

Expected: starts on `http://localhost:3001` with no errors (visiting it will redirect toward `/blogs`, which doesn't exist yet — a 404 there is expected until Task 22). Stop with Ctrl+C.

- [ ] **Step 11: Commit**

```bash
git add admin/package.json admin/package-lock.json admin/jsconfig.json admin/next.config.js admin/.gitignore admin/.env.example admin/src/app/layout.js admin/src/app/globals.css admin/src/app/page.js
git commit -m "Scaffold admin Next.js app"
```

---

## Task 20: Admin API client + login page

**Files:**
- Create: `admin/src/lib/api.js`
- Create: `admin/src/app/login/page.js`

**Interfaces:**
- Produces: `apiFetch(path, options)` — a `fetch` wrapper that prefixes `NEXT_PUBLIC_BACKEND_URL`, sends `credentials: "include"`, sets JSON headers, and throws `Error(message)` on a non-2xx response (using the backend's `{ message }` body).
- Consumed by: every later admin page (Tasks 21-24).

- [ ] **Step 1: Write `admin/src/lib/api.js`**

```js
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

async function apiFetch(path, options = {}) {
	const res = await fetch(`${BACKEND_URL}${path}`, {
		...options,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...(options.headers || {}),
		},
	});

	const data = await res.json().catch(() => ({}));

	if (!res.ok) {
		throw new Error(data.message || `Request failed with status ${res.status}`);
	}

	return data;
}

export default apiFetch;
```

- [ ] **Step 2: Write `admin/src/app/login/page.js`**

```js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import apiFetch from "@/lib/api";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async e => {
		e.preventDefault();
		setError("");
		setIsSubmitting(true);

		try {
			await apiFetch("/api/admin/login", {
				method: "POST",
				body: JSON.stringify({ email, password }),
			});
			router.push("/blogs");
		} catch (err) {
			setError(err.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="page page-narrow">
			<h1>Admin Login</h1>
			<form onSubmit={handleSubmit} className="form">
				<div className="form-field">
					<label htmlFor="email">Email</label>
					<input
						id="email"
						type="email"
						value={email}
						onChange={e => setEmail(e.target.value)}
						required
					/>
				</div>
				<div className="form-field">
					<label htmlFor="password">Password</label>
					<input
						id="password"
						type="password"
						value={password}
						onChange={e => setPassword(e.target.value)}
						required
					/>
				</div>
				{error ? <p className="error">{error}</p> : null}
				<button type="submit" className="button" disabled={isSubmitting}>
					{isSubmitting ? "Logging in..." : "Log in"}
				</button>
			</form>
		</div>
	);
}
```

- [ ] **Step 3: Manually verify**

With the backend running (`backend/`: `npm run dev`) and the admin app running (`admin/`: `npm run dev`), open `http://localhost:3001/login`, enter the `ADMIN_EMAIL`/`ADMIN_PASSWORD` from `backend/.env`, and submit. Expected: attempts to navigate to `/blogs` (404 for now, until Task 22 — that's fine, it confirms login succeeded and the cookie was set). Try a wrong password too — expected: an error message appears, no navigation.

- [ ] **Step 4: Commit**

```bash
git add admin/src/lib/api.js admin/src/app/login/page.js
git commit -m "Add admin API client and login page"
```

---

## Task 21: Admin auth guard + nav

**Files:**
- Create: `admin/src/components/AdminNav.js`
- Create: `admin/src/components/RequireAuth.js`

**Interfaces:**
- Produces: `<RequireAuth>{children}</RequireAuth>` — client component that calls `GET /api/admin/me` on mount, redirects to `/login` on failure, otherwise renders `<AdminNav />` plus `children`.
- Consumed by: Tasks 22, 23, 24 (every protected admin page wraps its content in this).

- [ ] **Step 1: Write `admin/src/components/AdminNav.js`**

```js
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import apiFetch from "@/lib/api";

export default function AdminNav() {
	const router = useRouter();

	const handleLogout = async () => {
		await apiFetch("/api/admin/logout", { method: "POST" });
		router.push("/login");
	};

	return (
		<nav className="nav">
			<Link href="/blogs">Blogs</Link>
			<Link href="/messages">Messages</Link>
			<button type="button" className="button-link" onClick={handleLogout}>
				Log out
			</button>
		</nav>
	);
}
```

- [ ] **Step 2: Write `admin/src/components/RequireAuth.js`**

```js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiFetch from "@/lib/api";
import AdminNav from "./AdminNav";

export default function RequireAuth({ children }) {
	const router = useRouter();
	const [status, setStatus] = useState("checking");

	useEffect(() => {
		apiFetch("/api/admin/me")
			.then(() => setStatus("authenticated"))
			.catch(() => {
				setStatus("redirecting");
				router.push("/login");
			});
	}, [router]);

	if (status !== "authenticated") {
		return <div className="page">Loading...</div>;
	}

	return (
		<div className="page">
			<AdminNav />
			{children}
		</div>
	);
}
```

- [ ] **Step 3: Commit**

```bash
git add admin/src/components/AdminNav.js admin/src/components/RequireAuth.js
git commit -m "Add admin auth guard and nav"
```

(No standalone manual check here — this is exercised end-to-end by Task 22, the first page that uses it.)

---

## Task 22: Admin blogs list page

**Files:**
- Create: `admin/src/app/blogs/page.js`

**Interfaces:**
- Consumes: `RequireAuth` (Task 21), `apiFetch` (Task 20), backend's `GET /api/admin/blogs` and `DELETE /api/admin/blogs/:id` (Task 9).

- [ ] **Step 1: Write `admin/src/app/blogs/page.js`**

```js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";

function BlogsList() {
	const [blogs, setBlogs] = useState([]);
	const [error, setError] = useState("");

	const loadBlogs = () => {
		apiFetch("/api/admin/blogs")
			.then(data => setBlogs(data.blogs || []))
			.catch(err => setError(err.message));
	};

	useEffect(() => {
		loadBlogs();
	}, []);

	const handleDelete = async id => {
		if (!confirm("Delete this post?")) return;
		try {
			await apiFetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
			loadBlogs();
		} catch (err) {
			setError(err.message);
		}
	};

	return (
		<div>
			<div className="page-header">
				<h1>Blogs</h1>
				<Link href="/blogs/new" className="button">
					New Post
				</Link>
			</div>
			{error ? <p className="error">{error}</p> : null}
			<table className="table">
				<thead>
					<tr>
						<th>Title</th>
						<th>Slug</th>
						<th>Published</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{blogs.map(blog => (
						<tr key={blog.id}>
							<td>{blog.title}</td>
							<td>{blog.slug}</td>
							<td>{blog.published ? "Yes" : "Draft"}</td>
							<td>
								<Link href={`/blogs/${blog.id}/edit`}>Edit</Link>{" "}
								<button
									type="button"
									className="button-link"
									onClick={() => handleDelete(blog.id)}
								>
									Delete
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default function BlogsPage() {
	return (
		<RequireAuth>
			<BlogsList />
		</RequireAuth>
	);
}
```

- [ ] **Step 2: Manually verify**

With both backend and admin dev servers running, log in at `http://localhost:3001/login`, land on `/blogs`. Expected: a table listing the 9 seeded posts. Try deleting one (confirm dialog appears, row disappears after confirming).

- [ ] **Step 3: Commit**

```bash
git add admin/src/app/blogs/page.js
git commit -m "Add admin blogs list page"
```

---

## Task 23: Admin blog create + edit pages

**Files:**
- Create: `admin/src/components/BlogForm.js`
- Create: `admin/src/app/blogs/new/page.js`
- Create: `admin/src/app/blogs/[id]/edit/page.js`

**Interfaces:**
- Consumes: `apiFetch` (Task 20), `RequireAuth` (Task 21), backend's `POST /api/admin/blogs`, `GET /api/admin/blogs/:id`, `PUT /api/admin/blogs/:id` (Task 9).

- [ ] **Step 1: Write `admin/src/components/BlogForm.js`**

```js
"use client";

import { useState } from "react";

const initialState = {
	title: "",
	slug: "",
	excerpt: "",
	content: "",
	img: "",
	category: "",
	tags: "",
	author: "",
	authorRole: "",
	status: "",
	published: true,
};

export default function BlogForm({ initialValues, onSubmit, submitLabel }) {
	const [values, setValues] = useState({
		...initialState,
		...initialValues,
		tags: initialValues?.tags ? initialValues.tags.join(", ") : "",
	});
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleChange = e => {
		const { name, value, type, checked } = e.target;
		setValues(prev => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	const handleSubmit = async e => {
		e.preventDefault();
		setError("");
		setIsSubmitting(true);

		try {
			await onSubmit({
				...values,
				tags: values.tags
					.split(",")
					.map(tag => tag.trim())
					.filter(Boolean),
			});
		} catch (err) {
			setError(err.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="form">
			<div className="form-field">
				<label htmlFor="title">Title</label>
				<input id="title" name="title" value={values.title} onChange={handleChange} required />
			</div>
			<div className="form-field">
				<label htmlFor="slug">Slug</label>
				<input id="slug" name="slug" value={values.slug} onChange={handleChange} required />
			</div>
			<div className="form-field">
				<label htmlFor="excerpt">Excerpt</label>
				<textarea id="excerpt" name="excerpt" value={values.excerpt} onChange={handleChange} />
			</div>
			<div className="form-field">
				<label htmlFor="content">Content</label>
				<textarea id="content" name="content" rows={10} value={values.content} onChange={handleChange} />
			</div>
			<div className="form-field">
				<label htmlFor="img">Image URL</label>
				<input id="img" name="img" value={values.img} onChange={handleChange} />
			</div>
			<div className="form-field">
				<label htmlFor="category">Category</label>
				<input id="category" name="category" value={values.category} onChange={handleChange} />
			</div>
			<div className="form-field">
				<label htmlFor="tags">Tags (comma separated)</label>
				<input id="tags" name="tags" value={values.tags} onChange={handleChange} />
			</div>
			<div className="form-field">
				<label htmlFor="author">Author</label>
				<input id="author" name="author" value={values.author} onChange={handleChange} />
			</div>
			<div className="form-field">
				<label htmlFor="authorRole">Author role</label>
				<input id="authorRole" name="authorRole" value={values.authorRole} onChange={handleChange} />
			</div>
			<div className="form-field">
				<label htmlFor="status">Status badge</label>
				<input id="status" name="status" value={values.status} onChange={handleChange} />
			</div>
			<div className="form-field form-field-checkbox">
				<label htmlFor="published">
					<input
						id="published"
						name="published"
						type="checkbox"
						checked={values.published}
						onChange={handleChange}
					/>
					{" "}Published
				</label>
			</div>
			{error ? <p className="error">{error}</p> : null}
			<button type="submit" className="button" disabled={isSubmitting}>
				{isSubmitting ? "Saving..." : submitLabel}
			</button>
		</form>
	);
}
```

- [ ] **Step 2: Write `admin/src/app/blogs/new/page.js`**

```js
"use client";

import { useRouter } from "next/navigation";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import BlogForm from "@/components/BlogForm";

function NewBlog() {
	const router = useRouter();

	const handleSubmit = async values => {
		await apiFetch("/api/admin/blogs", {
			method: "POST",
			body: JSON.stringify(values),
		});
		router.push("/blogs");
	};

	return (
		<div>
			<h1>New Post</h1>
			<BlogForm onSubmit={handleSubmit} submitLabel="Create Post" />
		</div>
	);
}

export default function NewBlogPage() {
	return (
		<RequireAuth>
			<NewBlog />
		</RequireAuth>
	);
}
```

- [ ] **Step 3: Write `admin/src/app/blogs/[id]/edit/page.js`**

```js
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import BlogForm from "@/components/BlogForm";

function EditBlog() {
	const { id } = useParams();
	const router = useRouter();
	const [blog, setBlog] = useState(null);
	const [error, setError] = useState("");

	useEffect(() => {
		apiFetch(`/api/admin/blogs/${id}`)
			.then(data => setBlog(data.blog))
			.catch(err => setError(err.message));
	}, [id]);

	const handleSubmit = async values => {
		await apiFetch(`/api/admin/blogs/${id}`, {
			method: "PUT",
			body: JSON.stringify(values),
		});
		router.push("/blogs");
	};

	if (error) return <p className="error">{error}</p>;
	if (!blog) return <p>Loading...</p>;

	return (
		<div>
			<h1>Edit Post</h1>
			<BlogForm initialValues={blog} onSubmit={handleSubmit} submitLabel="Save Changes" />
		</div>
	);
}

export default function EditBlogPage() {
	return (
		<RequireAuth>
			<EditBlog />
		</RequireAuth>
	);
}
```

- [ ] **Step 4: Manually verify**

With both dev servers running and logged in: go to `/blogs/new`, fill in Title "Test Post", Slug "test-post", Excerpt "A test", Content "First paragraph.\n\nSecond paragraph.", submit. Expected: redirects to `/blogs`, "Test Post" appears in the list. Click "Edit" on it, change the title, save. Expected: redirects to `/blogs`, updated title shows. On the live site (`http://localhost:4000/blogs`), the new post should now also appear (backend is the source of truth) — open it and confirm the two content paragraphs you typed render as the intro text (this proves Task 17's fix).

- [ ] **Step 5: Commit**

```bash
git add admin/src/components/BlogForm.js admin/src/app/blogs/new/page.js "admin/src/app/blogs/[id]/edit/page.js"
git commit -m "Add admin blog create and edit pages"
```

---

## Task 24: Admin messages page

**Files:**
- Create: `admin/src/app/messages/page.js`

**Interfaces:**
- Consumes: `apiFetch` (Task 20), `RequireAuth` (Task 21), backend's `GET /api/admin/messages` and `PATCH /api/admin/messages/:id` (Task 10).

- [ ] **Step 1: Write `admin/src/app/messages/page.js`**

```js
"use client";

import { useEffect, useState } from "react";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";

function MessagesList() {
	const [messages, setMessages] = useState([]);
	const [error, setError] = useState("");

	const loadMessages = () => {
		apiFetch("/api/admin/messages")
			.then(data => setMessages(data.messages || []))
			.catch(err => setError(err.message));
	};

	useEffect(() => {
		loadMessages();
	}, []);

	const handleMarkRead = async id => {
		try {
			await apiFetch(`/api/admin/messages/${id}`, {
				method: "PATCH",
				body: JSON.stringify({ status: "read" }),
			});
			loadMessages();
		} catch (err) {
			setError(err.message);
		}
	};

	return (
		<div>
			<h1>Messages</h1>
			{error ? <p className="error">{error}</p> : null}
			<table className="table">
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
						<th>Phone</th>
						<th>Service</th>
						<th>Message</th>
						<th>Status</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{messages.map(message => (
						<tr key={message.id}>
							<td>{message.name}</td>
							<td>{message.email}</td>
							<td>{message.phone || "-"}</td>
							<td>{message.service || "-"}</td>
							<td>{message.message}</td>
							<td>{message.status}</td>
							<td>
								{message.status === "new" ? (
									<button
										type="button"
										className="button-link"
										onClick={() => handleMarkRead(message.id)}
									>
										Mark read
									</button>
								) : null}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default function MessagesPage() {
	return (
		<RequireAuth>
			<MessagesList />
		</RequireAuth>
	);
}
```

- [ ] **Step 2: Manually verify**

With both dev servers running, submit the live site's contact form at `http://localhost:4000/contact`. Then, in the admin app, go to `/messages`. Expected: your submission appears with status "new". Click "Mark read". Expected: status changes to "read" and the button disappears.

- [ ] **Step 3: Commit**

```bash
git add admin/src/app/messages/page.js
git commit -m "Add admin messages page"
```

---

## Task 25: Full three-app smoke test + docs

**Files:**
- Modify: `README.md` (append a new section)

**Interfaces:** none — this is the final verification and documentation task.

- [ ] **Step 1: Append a running-locally section to the root `README.md`**

Add to the end of `README.md`:

```markdown

## Running the full stack locally (site + backend + admin)

This repo has three independently-runnable pieces:

- The live site (this folder) — port 4000
- `backend/` — the API + SQLite database — port 5000
- `admin/` — the Admin Panel — port 3001

First-time setup:

```bash
# Backend
cd backend
npm install
cp .env.example .env   # then edit JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npx prisma migrate dev --name init
npm run seed

# Admin
cd ../admin
npm install
cp .env.example .env.local

# Site
cd ..
cp .env.example .env.local
npm install
```

Every day after that, run all three in separate terminals:

```bash
cd backend && npm run dev     # http://localhost:5000
cd admin && npm run dev       # http://localhost:3001
npm run dev                   # http://localhost:4000 (site, from the repo root)
```

Log into the Admin Panel at `http://localhost:3001/login` with the
`ADMIN_EMAIL`/`ADMIN_PASSWORD` you set in `backend/.env`. Posts created or
edited there appear on the live site's `/blogs` page immediately. Contact
form submissions on the live site appear under Admin → Messages.

If the backend isn't running, the live site's blog pages automatically
fall back to the bundled `public/fakedata/blogs.json` instead of failing.

SMTP is not configured yet — contact submissions are saved and visible in
Admin either way; email notifications start working once `backend/.env`'s
`SMTP_*` values are filled in.
```

- [ ] **Step 2: Run the backend test suite one more time**

Run (from `backend/`):
```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Run the site's test**

Run (from the repo root):
```bash
node --test src/libs/blogsApi.test.js
```

Expected: passes.

- [ ] **Step 4: Run a production build of the site**

Run (from the repo root):
```bash
npm run build
```

Expected: builds successfully. `generateStaticParams` in `src/app/blogs/[slug]/page.js` will hit the backend if it's running (pre-rendering the real seeded slugs) or fall back to the local JSON if not — either way, the build must not fail.

- [ ] **Step 5: Full manual walkthrough**

With all three dev servers running:

1. Visit `http://localhost:4000/blogs` — see the seeded posts.
2. Open one post — content renders correctly, prev/next links work.
3. Submit the contact form at `http://localhost:4000/contact` (real name/email/message).
4. Log into `http://localhost:3001/login`.
5. Go to `/messages` — see the submission from step 3, mark it read.
6. Go to `/blogs`, click "New Post", create one, confirm it appears on `http://localhost:4000/blogs` right away.
7. Edit that post's title in Admin, confirm the live site reflects the change on refresh.
8. Delete that post in Admin, confirm it's gone from the live site.

- [ ] **Step 6: Commit**

```bash
git add README.md
git commit -m "Document running the site, backend, and admin panel together locally"
```
