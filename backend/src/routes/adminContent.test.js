const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { execSync } = require("node:child_process");

const testDbPath = path.join(__dirname, "../../data/test-admin-content.db");
process.env.DATABASE_URL = `file:${testDbPath}`;
process.env.JWT_SECRET = "test-secret";
process.env.RESOURCE_FILES_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "resource-files-"));

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
const adminContentRouter = require("./adminContent");
const uploadRouter = require("./upload");
const { signAdminToken, COOKIE_NAME } = require("../lib/auth");

function buildApp() {
	const app = express();
	app.use(express.json());
	app.use(cookieParser());
	app.use("/api/admin/content", adminContentRouter);
	app.use("/api/admin/upload", uploadRouter);
	return app;
}

function authCookie() {
	const token = signAdminToken({ id: 1, email: "admin@example.com" });
	return `${COOKIE_NAME}=${token}`;
}

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
