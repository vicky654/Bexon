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

test("getBlogsFromBackend does not throw on a malformed search value when the backend is unreachable", async () => {
	const originalFetch = global.fetch;
	global.fetch = async () => {
		throw new Error("network error");
	};

	try {
		const { getBlogsFromBackend } = require("./blogsApi");
		await assert.doesNotReject(() => getBlogsFromBackend({ search: "[" }));
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
