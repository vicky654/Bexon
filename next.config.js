/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
	images: {
		// Admin can set a blog's Image URL to any external address; without a
		// permissive remotePatterns entry next/image throws ("hostname not
		// configured") and takes down the whole /blogs listing page. This is
		// a low-traffic internal tool, not a public UGC site, so allowing any
		// https host is an acceptable trade-off for not crashing the page.
		remotePatterns: [{ protocol: "https", hostname: "**" }],
	},
};

module.exports = nextConfig;
