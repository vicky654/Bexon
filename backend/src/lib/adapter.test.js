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
