const path = require("node:path");
const { toNextRedirects } = require("./src/content/redirects.cjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
	// A package-lock.json and node_modules on the Desktop made Next.js treat the
	// whole Desktop as the project root, so the dev compiler watched and
	// resolved every other project there. Pin the root to this folder.
	turbopack: { root: path.resolve(__dirname) },
	outputFileTracingRoot: path.resolve(__dirname),
	// 301s from the old PHP site's addresses (see src/content/redirects.cjs).
	async redirects() {
		return toNextRedirects();
	},
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
