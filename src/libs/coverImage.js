// Cover image for a blog/content card. The template's sample images under
// /images/blog/ and /images/project/ are grey "870X450" placeholders (or no
// longer exist), so those, like a missing image, fall back to the branded
// DPDP cover.
export const DEFAULT_COVER = "/images/site/blog-cover.svg";

export default function coverImage(src) {
	if (!src || typeof src !== "string") return DEFAULT_COVER;
	if (/^\/images\/(blog|project)\//.test(src)) return DEFAULT_COVER;
	return src;
}
