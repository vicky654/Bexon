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
