import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validatePage, SECTION_TYPES, iconNamesFromCss, knownRoutes } from "./validate.js";
import { PAGES } from "./pages/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const iconNames = iconNamesFromCss(fs.readFileSync(path.join(root, "src/app/assets/css/dpdp-icons.css"), "utf8"));
const ctx = { knownRoutes: knownRoutes(PAGES), iconNames, publicDir: path.join(root, "public") };

const good = {
	path: "/x",
	title: "X",
	description: "Short description.",
	hero: { title: "X", text: "Intro" },
	sections: [{ type: "richText", html: "<p>Hello <a href=\"/contact\">us</a></p>" }],
};

test("section types are the fixed set", () => {
	assert.deepEqual(SECTION_TYPES, ["homeHero", "richText", "features", "split", "steps", "stats", "faq", "cta", "cardsLinks"]);
});

test("a valid page has no errors", () => {
	assert.deepEqual(validatePage(good, ctx), []);
});

test("unknown section types and missing fields are reported with the path", () => {
	const errors = validatePage({ ...good, title: "", sections: [{ type: "gallery" }] }, ctx);
	assert.ok(errors.some(e => e.startsWith("/x:") && e.includes("title")));
	assert.ok(errors.some(e => e.includes("gallery")));
});

test("descriptions over 160 characters are rejected", () => {
	assert.ok(validatePage({ ...good, description: "x".repeat(161) }, ctx).length);
});

test("unsafe HTML is rejected", () => {
	for (const html of [
		"<script>alert(1)</script>",
		"<img src=x onerror=alert(1)>",
		"<p style=\"color:red\">x</p>",
		"<a href=\"javascript:alert(1)\">x</a>",
		"<p onclick=\"x()\">x</p>",
		"<iframe src=\"/\"></iframe>",
	]) {
		assert.ok(validatePage({ ...good, sections: [{ type: "richText", html }] }, ctx).length, html);
	}
});

test("broken internal links, unknown icons and missing images are reported", () => {
	const page = {
		...good,
		sections: [
			{ type: "richText", html: "<p><a href=\"/nope\">x</a></p>" },
			{ type: "features", heading: "H", items: [{ icon: "tji-made-up", title: "T", text: "t", href: "/also-nope" }] },
			{ type: "split", heading: "H", html: "<p>x</p>", image: "/images/site/none.webp", imageAlt: "x" },
		],
	};
	const errors = validatePage(page, ctx);
	assert.ok(errors.some(e => e.includes("/nope")));
	assert.ok(errors.some(e => e.includes("/also-nope")));
	assert.ok(errors.some(e => e.includes("tji-made-up")));
	assert.ok(errors.some(e => e.includes("none.webp")));
});

test("every real content page is valid and paths are unique", () => {
	const paths = PAGES.map(p => p.path);
	assert.equal(new Set(paths).size, paths.length, "duplicate page paths");
	const errors = PAGES.flatMap(p => validatePage(p, ctx));
	assert.deepEqual(errors, []);
});
