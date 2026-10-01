import { PAGES } from "@/content/pages";
import { SITE_URL } from "@/libs/seo";

// /sitemap.xml: every content page and listing, plus blog posts, news,
// events, resources and job openings from the backend. Rebuilt hourly so
// new posts are listed without a redeploy. Backend outages just leave the
// dynamic entries out for that hour.
export const revalidate = 3600;

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const LISTINGS = ["/blogs", "/news", "/events", "/resources", "/careers", "/contact", "/book-consultation", "/partner-with-us", "/subscribe"];
const CONTENT_KINDS = [
	{ kind: "news", base: "/news" },
	{ kind: "event", base: "/events" },
	{ kind: "resource", base: "/resources" },
];
const MAX_PAGES = 50;

async function getJson(path) {
	try {
		const res = await fetch(`${BACKEND_URL}${path}`, { next: { revalidate }, signal: AbortSignal.timeout(8000) });
		return res.ok ? await res.json() : null;
	} catch {
		return null;
	}
}

async function contentEntries({ kind, base }) {
	const entries = [];
	for (let page = 1; page <= MAX_PAGES; page++) {
		const data = await getJson(`/api/content?kind=${kind}&page=${page}`);
		const items = data?.items || [];
		items.forEach(item => {
			entries.push({ url: `${SITE_URL}${base}/${item.slug}`, lastModified: item.updatedAt || item.publishedAt, changeFrequency: "monthly", priority: 0.6 });
		});
		if (!data || items.length < (data.pageSize || 9)) break;
	}
	return entries;
}

export default async function sitemap() {
	const pages = PAGES.map(page => ({
		url: `${SITE_URL}${page.path === "/" ? "" : page.path}`,
		changeFrequency: page.path === "/" ? "weekly" : "monthly",
		priority: page.path === "/" ? 1 : page.path.split("/").length > 2 ? 0.7 : 0.8,
	}));
	const listings = LISTINGS.map(path => ({ url: `${SITE_URL}${path}`, changeFrequency: "weekly", priority: 0.7 }));

	const [blogs, jobs, ...content] = await Promise.all([getJson("/api/blogs"), getJson("/api/jobs"), ...CONTENT_KINDS.map(contentEntries)]);
	const blogEntries = (blogs?.blogs || []).map(blog => ({ url: `${SITE_URL}/blogs/${blog.slug}`, changeFrequency: "monthly", priority: 0.6 }));
	const jobEntries = (jobs?.jobs || []).map(job => ({ url: `${SITE_URL}/careers/${job.id}`, lastModified: job.updatedAt, changeFrequency: "weekly", priority: 0.5 }));

	return [...pages, ...listings, ...blogEntries, ...content.flat(), ...jobEntries];
}
