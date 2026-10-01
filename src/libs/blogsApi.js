const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

// Blog posts come only from the backend. If it is unreachable the site shows
// no posts (an empty list / not found) instead of the template's sample posts,
// which search engines could otherwise index.

async function getBlogsFromBackend(filters = {}) {
	const params = new URLSearchParams();
	Object.entries(filters).forEach(([key, value]) => {
		if (value) params.set(key, value);
	});
	const queryString = params.toString();

	try {
		const res = await fetch(`${BACKEND_URL}/api/blogs${queryString ? `?${queryString}` : ""}`, { cache: "no-store" });
		if (!res.ok) throw new Error(`Backend responded with ${res.status}`);
		const data = await res.json();
		return data.blogs || [];
	} catch (error) {
		console.warn("Blog posts unavailable:", error.message);
		return [];
	}
}

async function getBlogFromBackendBySlug(slug) {
	try {
		const res = await fetch(`${BACKEND_URL}/api/blogs/${slug}`, { cache: "no-store" });
		if (res.status === 404) return null;
		if (!res.ok) throw new Error(`Backend responded with ${res.status}`);
		const data = await res.json();
		return data.blog || null;
	} catch (error) {
		console.warn("Blog post unavailable:", error.message);
		return null;
	}
}

module.exports = { getBlogsFromBackend, getBlogFromBackendBySlug };
