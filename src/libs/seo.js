// Shared SEO metadata. Every page passes its own path so it gets a canonical
// URL (redirected old addresses and ?query variants consolidate onto it) and
// Open Graph / Twitter tags for link previews.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.dpdpconsultants.com").replace(/\/$/, "");
export const SITE_NAME = "DPDP Consultants";
export const DEFAULT_OG_IMAGE = "/images/site/og-default.png";

export function pageMetadata({ title, description, path, image, noindex = false }) {
	const images = [{ url: image || DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: title }];
	return {
		title,
		description,
		alternates: { canonical: path },
		openGraph: {
			type: "website",
			siteName: SITE_NAME,
			locale: "en_IN",
			url: path,
			title,
			description,
			images,
		},
		twitter: { card: "summary_large_image", title, description, images: images.map(i => i.url) },
		...(noindex ? { robots: { index: false, follow: true } } : {}),
	};
}
