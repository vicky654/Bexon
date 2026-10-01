import { SITE_URL } from "@/libs/seo";

// /robots.txt: crawl everything except internal API routes and the
// post-form thank-you page; point crawlers at the sitemap.
export default function robots() {
	return {
		rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/thank-you"] }],
		sitemap: `${SITE_URL}/sitemap.xml`,
		host: SITE_URL,
	};
}
