const test = require("node:test");
const assert = require("node:assert/strict");

// When the backend is unreachable the site shows no posts rather than
// template sample posts (which search engines could otherwise index).
async function withNetworkDown(fn) {
	const originalFetch = global.fetch;
	global.fetch = async () => {
		throw new Error("network error");
	};
	try {
		await fn();
	} finally {
		global.fetch = originalFetch;
	}
}

test("getBlogsFromBackend returns an empty list when the backend is unreachable", async () => {
	await withNetworkDown(async () => {
		const { getBlogsFromBackend } = require("./blogsApi");
		assert.deepEqual(await getBlogsFromBackend(), []);
		assert.deepEqual(await getBlogsFromBackend({ search: "[" }), []);
	});
});

test("getBlogFromBackendBySlug returns null when the backend is unreachable", async () => {
	await withNetworkDown(async () => {
		const { getBlogFromBackendBySlug } = require("./blogsApi");
		assert.equal(await getBlogFromBackendBySlug("innovative-solutions-for-every-business-success"), null);
	});
});
