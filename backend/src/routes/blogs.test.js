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

test("GET /api/blogs?search=[ returns 200 instead of throwing on malformed regex input", async () => {
	const res = await request(buildApp()).get("/api/blogs").query({ search: "[" });

	assert.equal(res.status, 200);
	assert.ok(Array.isArray(res.body.blogs));
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
