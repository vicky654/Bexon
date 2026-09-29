const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const EMPTY_PAGE = { items: [], total: 0, page: 1, pageSize: 9 };

export async function getContentList({ kind, page = 1, resourceType, when } = {}) {
	const params = new URLSearchParams({ kind, page: String(page) });
	if (resourceType) params.set("resourceType", resourceType);
	if (when) params.set("when", when);
	try {
		const res = await fetch(`${BACKEND_URL}/api/content?${params}`, { cache: "no-store" });
		return res.ok ? await res.json() : EMPTY_PAGE;
	} catch {
		return EMPTY_PAGE;
	}
}

export async function getContentItem(kind, slug) {
	try {
		const res = await fetch(`${BACKEND_URL}/api/content/${kind}/${encodeURIComponent(slug)}`, { cache: "no-store" });
		return res.ok ? (await res.json()).item : null;
	} catch {
		return null;
	}
}
