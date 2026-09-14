const localBlogs = require("../../public/fakedata/blogs.json");

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

function makePath(text) {
	if (!text) return "#";
	const normalized = text.toLowerCase().split("/").join(" ").split("&").join(" ");
	return normalized.split(" ").join("_");
}

function readLocalBlogs() {
	return localBlogs;
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
		const target = search.toLowerCase();
		return items.filter(item => item.title.toLowerCase().includes(target));
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
