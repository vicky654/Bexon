import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/libs/seo";

// schema.org data for search engines, rendered with <JsonLd>.

const absolute = path => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`);

const PUBLISHER = {
	"@type": "Organization",
	name: SITE_NAME,
	logo: { "@type": "ImageObject", url: `${SITE_URL}/images/logos/DPDPLogo.png` },
};

// FAQ answers are stored as HTML; schema.org allows basic markup in `text`.
export function faqPage(items = []) {
	const entries = items.filter(item => item?.question && item?.answer);
	if (!entries.length) return null;
	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: entries.map(({ question, answer }) => ({
			"@type": "Question",
			name: question,
			acceptedAnswer: { "@type": "Answer", text: answer },
		})),
	};
}

// A blog post (BlogPosting) or news item (NewsArticle). `image` should be a
// real photo; the SVG placeholder cover falls back to the default share image.
export function article({ type = "BlogPosting", title, description, path, image, publishedAt, updatedAt, author }) {
	const data = {
		"@context": "https://schema.org",
		"@type": type,
		headline: title,
		mainEntityOfPage: { "@type": "WebPage", "@id": absolute(path) },
		url: absolute(path),
		image: [absolute(image && !image.endsWith(".svg") ? image : DEFAULT_OG_IMAGE)],
		author: author && author !== SITE_NAME ? { "@type": "Person", name: author } : { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
		publisher: PUBLISHER,
	};
	if (description) data.description = description;
	if (publishedAt) data.datePublished = publishedAt;
	if (updatedAt || publishedAt) data.dateModified = updatedAt || publishedAt;
	return data;
}

// Home > ...crumbs > current page. The last item may omit its URL.
export function breadcrumbList(crumbs = [], current) {
	const items = [{ name: "Home", path: "/" }, ...crumbs.filter(c => c?.name)];
	if (current) items.push({ name: current });
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map(({ name, path }, idx) => ({
			"@type": "ListItem",
			position: idx + 1,
			name,
			...(path ? { item: absolute(path) } : {}),
		})),
	};
}
