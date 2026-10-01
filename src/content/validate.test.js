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
	assert.deepEqual(SECTION_TYPES, ["homeHero", "richText", "features", "split", "steps", "stats", "faq", "cta", "cardsLinks", "marquee", "team", "logos"]);
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

test("HTML tokenizer bypasses (comments, doctype, stray <, unclosed tags) are rejected", () => {
	for (const html of [
		"<!-- <p>hidden</p> --><p>x</p>",
		"<!DOCTYPE html><p>x</p>",
		"<p>a < b</p>",
		"<img src=x onerror=alert(1) ",
	]) {
		assert.ok(validatePage({ ...good, sections: [{ type: "richText", html }] }, ctx).length, html);
	}
});

test("duplicate href attributes are rejected in either casing", () => {
	for (const html of [
		"<p><a href=\"/contact\" href=\"/faq\">x</a></p>",
		"<p><a href=\"/contact\" HREF=\"/faq\">x</a></p>",
	]) {
		assert.ok(validatePage({ ...good, sections: [{ type: "richText", html }] }, ctx).length, html);
	}
});

test("internal, https and mailto links with query strings or hashes are accepted", () => {
	for (const html of [
		"<p><a href=\"/contact?x=1#y\">x</a></p>",
		"<p><a href=\"https://example.com/?a=b\">x</a></p>",
		"<p><a href=\"mailto:a@b.com?subject=Hi\">x</a></p>",
	]) {
		assert.deepEqual(validatePage({ ...good, sections: [{ type: "richText", html }] }, ctx), []);
	}
});

test("a secondary button without a label is rejected", () => {
	const cta = {
		...good,
		sections: [
			{
				type: "cta",
				heading: "H",
				text: "t",
				primary: { label: "Go", href: "/contact" },
				secondary: { href: "/faq" },
			},
		],
	};
	assert.ok(validatePage(cta, ctx).some(e => e.includes("secondary.label")));
});

test("a null or non-object item is reported, not thrown", () => {
	const page = {
		...good,
		sections: [{ type: "features", heading: "H", items: [null, "not-an-object"] }],
	};
	assert.doesNotThrow(() => validatePage(page, ctx));
	const errors = validatePage(page, ctx);
	assert.ok(errors.length);
});

test("an image path containing .. is rejected", () => {
	const page = {
		...good,
		sections: [
			{
				type: "split",
				heading: "H",
				html: "<p>x</p>",
				image: "/images/../../etc/passwd.webp",
				imageAlt: "x",
			},
		],
	};
	assert.ok(validatePage(page, ctx).some(e => e.includes("not allowed")));
});

test("a link to / is accepted", () => {
	assert.deepEqual(validatePage({ ...good, sections: [{ type: "richText", html: "<p><a href=\"/\">home</a></p>" }] }, ctx), []);
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

test("a field the section type's component doesn't render is rejected", () => {
	const page = {
		...good,
		sections: [{ type: "richText", heading: "H", html: "<p>x</p>", intro: "never rendered" }],
	};
	const errors = validatePage(page, ctx);
	assert.ok(errors.some(e => e.includes("intro is not a field of richText")));
});

test("an unknown page-level field is rejected", () => {
	const errors = validatePage({ ...good, bogus: "nope" }, ctx);
	assert.ok(errors.some(e => e.includes("bogus is not a field of page")));
});

test("a page label is accepted when short and rejected when over 60 characters", () => {
	assert.deepEqual(validatePage({ ...good, label: "Short Label" }, ctx), []);
	assert.ok(validatePage({ ...good, label: "x".repeat(61) }, ctx).some(e => e.includes("label")));
});

test("every real content page is valid and paths are unique", () => {
	const paths = PAGES.map(p => p.path);
	assert.equal(new Set(paths).size, paths.length, "duplicate page paths");
	const errors = PAGES.flatMap(p => validatePage(p, ctx));
	assert.deepEqual(errors, []);
});

test("section anchors must be slug-like and unique per page", () => {
	const html = "<p>x</p>";
	assert.deepEqual(validatePage({ ...good, sections: [{ type: "richText", anchor: "our-team", html }] }, ctx), []);
	assert.ok(validatePage({ ...good, sections: [{ type: "richText", anchor: "Our Team", html }] }, ctx).length);
	const dup = validatePage({ ...good, sections: [
		{ type: "richText", anchor: "a", html },
		{ type: "richText", anchor: "a", html },
	] }, ctx);
	assert.ok(dup.some(e => e.includes("duplicate anchor")));
});

test("the About Us menu anchors exist on the About page", async () => {
	const { NAVIGATION } = await import("./navigation.js");
	const about = PAGES.find(p => p.path === "/about");
	const anchors = new Set(about.sections.map(s => s.anchor).filter(Boolean));
	const aboutMenu = NAVIGATION.find(item => item.href === "/about");
	for (const child of aboutMenu.children) {
		const hash = child.href.split("#")[1];
		assert.ok(anchors.has(hash), `missing anchor #${hash} on /about`);
	}
});

test("home hero highlight must be part of the title, badges are short strings", () => {
	const hero = { type: "homeHero", title: "Empowering DPDPA compliance", text: "t", primary: { label: "Go", href: "/contact" } };
	assert.deepEqual(validatePage({ ...good, sections: [{ ...hero, highlight: "DPDPA compliance", badges: ["24x7 Expert Advice"] }] }, ctx), []);
	assert.ok(validatePage({ ...good, sections: [{ ...hero, highlight: "not in title" }] }, ctx).some(e => e.includes("highlight")));
	assert.ok(validatePage({ ...good, sections: [{ ...hero, badges: ["x".repeat(61)] }] }, ctx).some(e => e.includes("badges")));
	assert.ok(validatePage({ ...good, sections: [{ ...hero, badges: "nope" }] }, ctx).some(e => e.includes("badges")));
});

test("marquee needs short text items; features variant and numbered are checked", () => {
	assert.deepEqual(validatePage({ ...good, sections: [{ type: "marquee", items: ["Consent Management", "DPIA"] }] }, ctx), []);
	assert.ok(validatePage({ ...good, sections: [{ type: "marquee", items: [] }] }, ctx).length);
	assert.ok(validatePage({ ...good, sections: [{ type: "marquee", items: [""] }] }, ctx).length);
	const item = { icon: "tji-check", title: "T", text: "t" };
	assert.deepEqual(validatePage({ ...good, sections: [{ type: "features", heading: "H", variant: "dark", numbered: true, items: [item] }] }, ctx), []);
	assert.ok(validatePage({ ...good, sections: [{ type: "features", heading: "H", variant: "neon", items: [item] }] }, ctx).some(e => e.includes("variant")));
	assert.ok(validatePage({ ...good, sections: [{ type: "features", heading: "H", numbered: "yes", items: [item] }] }, ctx).some(e => e.includes("numbered")));
});

test("stats may carry an optional heading", () => {
	const items = [{ value: "500+", label: "Assessments" }];
	assert.deepEqual(validatePage({ ...good, sections: [{ type: "stats", eyebrow: "E", heading: "H", intro: "I", items }] }, ctx), []);
});

test("team members need a name, role and an existing photo", () => {
	const member = { name: "Jaspal Singh", role: "Director", image: "/images/team/jaspal-singh.png" };
	assert.deepEqual(validatePage({ ...good, sections: [{ type: "team", heading: "Our Team", items: [member] }] }, ctx), []);
	assert.ok(validatePage({ ...good, sections: [{ type: "team", heading: "Our Team", items: [] }] }, ctx).length);
	assert.ok(validatePage({ ...good, sections: [{ type: "team", heading: "T", items: [{ ...member, role: "" }] }] }, ctx).some(e => e.includes("role")));
	assert.ok(validatePage({ ...good, sections: [{ type: "team", heading: "T", items: [{ ...member, image: "/images/team/nobody.png" }] }] }, ctx).some(e => e.includes("does not exist")));
});

test("every About page team member has a photo", () => {
	const about = PAGES.find(p => p.path === "/about");
	const team = about.sections.find(s => s.anchor === "our-team");
	assert.equal(team.type, "team");
	assert.equal(team.items.length, 12);
	assert.ok(team.items.every(m => m.image));
});

test("split sections may carry stat tiles", () => {
	const split = { type: "split", heading: "H", html: "<p>x</p>", image: "/images/site/home/nationwide-presence.webp", imageAlt: "Map" };
	assert.deepEqual(validatePage({ ...good, sections: [{ ...split, stats: [{ value: "500+", label: "Assessments" }] }] }, ctx), []);
	assert.ok(validatePage({ ...good, sections: [{ ...split, stats: [{ value: "", label: "Assessments" }] }] }, ctx).some(e => e.includes("value")));
	assert.ok(validatePage({ ...good, sections: [{ ...split, stats: "500+" }] }, ctx).some(e => e.includes("stats")));
});

test("logo sections list existing images, or load clients from the admin", () => {
	const logo = { name: "Lenovo", image: "/images/partner/lenovo.png" };
	assert.deepEqual(validatePage({ ...good, sections: [{ type: "logos", heading: "Our Partners", items: [logo] }] }, ctx), []);
	assert.deepEqual(validatePage({ ...good, sections: [{ type: "logos", heading: "Our Clients", source: "clients" }] }, ctx), []);
	assert.deepEqual(validatePage({ ...good, sections: [{ type: "logos", heading: "Our Partners", source: "partners" }] }, ctx), []);
	assert.ok(validatePage({ ...good, sections: [{ type: "logos", heading: "P" }] }, ctx).some(e => e.includes("items")));
	assert.ok(validatePage({ ...good, sections: [{ type: "logos", heading: "P", source: "everyone" }] }, ctx).some(e => e.includes("source")));
	assert.ok(validatePage({ ...good, sections: [{ type: "logos", heading: "P", items: [{ ...logo, image: "/images/partner/nope.png" }] }] }, ctx).some(e => e.includes("does not exist")));
	assert.ok(validatePage({ ...good, sections: [{ type: "logos", heading: "P", items: [{ ...logo, name: "" }] }] }, ctx).some(e => e.includes("name")));
});

test("split sections can use a built-in visual instead of an image", () => {
	const split = { type: "split", heading: "H", html: "<p>x</p>" };
	assert.deepEqual(validatePage({ ...good, sections: [{ ...split, visual: "presence-map" }] }, ctx), []);
	assert.ok(validatePage({ ...good, sections: [{ ...split, visual: "globe" }] }, ctx).some(e => e.includes("visual")));
	assert.ok(validatePage({ ...good, sections: [split] }, ctx).some(e => e.includes("image")));
});

test("old-site redirects all land on real pages and are well-formed", async () => {
	const { createRequire } = await import("node:module");
	const require = createRequire(import.meta.url);
	const { SITE_REDIRECTS, toNextRedirects } = require("./redirects.cjs");
	const routes = knownRoutes(PAGES);
	const home = PAGES.find(p => p.path === "/");
	const about = PAGES.find(p => p.path === "/about");
	const anchorsOf = page => new Set(page.sections.map(s => s.anchor).filter(Boolean));
	const seen = new Set();
	for (const rule of SITE_REDIRECTS) {
		assert.match(rule.from, /^\/[\w-]+\.php$/, `bad source ${rule.from}`);
		const key = rule.from + JSON.stringify(rule.query || {});
		assert.ok(!seen.has(key), `duplicate redirect ${key}`);
		seen.add(key);
		const [pathPart, hash] = rule.to.split("#");
		const route = pathPart.split("?")[0] || "/";
		// Migrated blog posts are checked against the import data in their own test.
		const isMigratedPost = rule.from === "/blog.php" && rule.query?.id && route.startsWith("/blogs/");
		assert.ok(isMigratedPost || routes.has(route), `${rule.from} -> ${rule.to}: unknown page`);
		if (hash) {
			const page = route === "/" ? home : route === "/about" ? about : null;
			assert.ok(page && anchorsOf(page).has(hash), `${rule.from} -> ${rule.to}: missing anchor`);
		}
	}
	// A query-specific rule must come before the plain rule for the same file.
	const firstPlain = new Map();
	SITE_REDIRECTS.forEach((rule, i) => {
		if (!rule.query && !firstPlain.has(rule.from)) firstPlain.set(rule.from, i);
	});
	SITE_REDIRECTS.forEach((rule, i) => {
		if (rule.query && firstPlain.has(rule.from)) assert.ok(i < firstPlain.get(rule.from), `${rule.from}?${JSON.stringify(rule.query)} is shadowed`);
	});
	assert.ok(toNextRedirects().every(r => r.permanent === true));
});

test("every migrated old blog post has its own redirect to the same slug as the import data", async () => {
	const { createRequire } = await import("node:module");
	const require = createRequire(import.meta.url);
	const { SITE_REDIRECTS } = require("./redirects.cjs");
	const imported = JSON.parse(fs.readFileSync(path.join(root, "backend/prisma/data/old-site-blogs.json"), "utf8"));
	const blogRules = SITE_REDIRECTS.filter(r => r.from === "/blog.php" && r.query?.id);
	assert.equal(blogRules.length, imported.length);
	for (const post of imported) {
		const rule = blogRules.find(r => r.query.id === String(post.oldId));
		assert.ok(rule, `no redirect for old post ${post.oldId}`);
		assert.equal(rule.to, `/blogs/${post.slug}`);
	}
});
