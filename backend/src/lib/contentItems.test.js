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
	// images shipped with the website (e.g. migrated newsletter covers)
	assert.equal(validateContent("news", { ...base, coverImage: "/images/news/newsletters_60_thumbnail.jpg" }), null);
	assert.ok(validateContent("news", { ...base, coverImage: "/images/../uploads/x.png" }));
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
