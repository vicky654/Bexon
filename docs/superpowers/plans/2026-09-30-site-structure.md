# Site Structure and Core Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the site its real structure — six-item navigation, 26 data-driven content pages migrated from the old site, a rebuilt Home page — and remove the template's demo pages.

**Architecture:** Page content lives in plain ES-module data files under `src/content/pages/` (a `package.json` with `"type": "module"` in `src/content/` lets `node --test` import them). A validator (`src/content/validate.js`) enforces the page schema and is run by a content test. A fixed set of section components in `src/components/sections/page/` renders the section types; `PageRenderer` maps types to components and `ContentPage` wraps them in the site layout. Thin route files look pages up by path. Navigation is one tree in `src/content/navigation.js` used by desktop, mobile and footer. Images are imported from the old site with a `sharp` script.

**Tech Stack:** Next.js 16 / React 19 (app router, server components), SCSS, `sharp`, `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-30-site-structure-design.md`

## Global Constraints

- URLs exactly as in the spec's sitemap table (e.g. `/dpdp-act/penalties-and-fines`, `/products/consent-management`, `/services/dpo-as-a-service`, `/about`, `/case-studies`, `/faq`, `/privacy-notice`, `/terms-and-conditions`).
- Section types exactly: `homeHero`, `richText`, `features`, `split`, `steps`, `stats`, `faq`, `cta`, `cardsLinks`.
- Allowed HTML tags inside `html` fields: `p`, `h3`, `h4`, `ul`, `ol`, `li`, `strong`, `em`, `a`, `br`. Links in HTML must be internal paths or `https://` / `mailto:` / `tel:`.
- Icons must be classes that exist in `src/app/assets/css/dpdp-icons.css` (e.g. `tji-service-1` … `tji-service-6`, `tji-check`, `tji-award`, `tji-team`, `tji-support`, `tji-growth`, `tji-chart`, `tji-innovative`, `tji-excellence`, `tji-manage`, `tji-operations`, `tji-organize`, `tji-performance`, `tji-process-1`, `tji-strategy`, `tji-worldwide`, `tji-complete`, `tji-box`).
- Content comes only from the old site (`C:\Users\Vicky\Desktop\dpdp-WebSite\*.php`); light edits only (typos, consistent names); **no invented facts, figures, clients, certifications or legal claims**. Legal pages verbatim apart from formatting.
- Page `description` ≤ 160 characters; prefer the old page's meta description / `$metadesc`.
- Images: only ones the page uses, WebP, ≤ 1600 px wide, target ≤ 300 KB, under `public/images/site/<section>/`, imported with `scripts/import-images.mjs`.
- Every internal `href` points to a known route: content page paths plus `/blogs`, `/news`, `/events`, `/resources`, `/careers`, `/contact`, `/book-consultation`, `/partner-with-us`, `/subscribe`.
- Header CTA "Book a Consultation" → `/book-consultation`.
- Code style: tabs, double quotes, semicolons, ES modules. Never touch `backend/.env` or the user's servers on :4000/:5000.

## Review Focus

1. **A content file with a typo'd section type or a broken internal link** → the content test fails and names the page and field. Test in Task 1.
2. **HTML in a content file containing a `<script>`, `<img onerror>`, `style` or `javascript:` link** → the content test rejects it. Test in Task 1.
3. **Navigating to a section page (e.g. `/products/consent-management`)** → the Products menu item is highlighted on desktop and its group is marked on mobile. Checked in Task 2.
4. **Two FAQ sections on one page** → each accordion opens independently (unique ids). Test in Task 1 (renderer unit) and visible in Task 6.
5. **A deleted demo route (`/shop`, `/home-02`)** → 404 page, and nothing still links to it. Checked in Task 8.

---

### Task 1: Page engine, validator, image script, pilot page

**Files:**
- Create: `src/content/package.json`, `src/content/validate.js`, `src/content/validate.test.js`, `src/content/pages/index.js`, `src/content/pages/dpdp-act-penalties-and-fines.js`, `src/components/sections/page/{RichTextSection,FeaturesSection,SplitSection,StepsSection,StatsSection,FaqSection,CtaSection,CardsLinksSection,HomeHeroSection,PageRenderer,ContentPage}.js`, `src/app/assets/sass/layout/_page.scss`, `scripts/import-images.mjs`, `src/app/dpdp-act/[slug]/page.js`
- Modify: `src/app/globals.scss` (forward `_page`), `package.json` (test script)

**Interfaces:**
- Produces:
  - Page module shape: `export default { path, title, description, parent?: "/dpdp-act", hero: { title, text } | null, sections: [ { type, ...fields } ] }`
  - `validatePage(page, { knownRoutes, iconNames, publicDir }) → string[]` (error messages, each prefixed with `page.path`)
  - `PAGES` (array) and `getPage(path)` from `src/content/pages/index.js`
  - `<ContentPage page={page} />` (server component, full site layout)
  - `node scripts/import-images.mjs <source> <dest> [<source> <dest> ...]` — `source` relative to the old site's `assets/images/`, `dest` relative to `public/images/site/`, writes WebP

- [ ] **Step 1: `src/content/package.json`**
```json
{ "type": "module" }
```

- [ ] **Step 2: Write the failing validator test** (`src/content/validate.test.js`)

```js
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
```

- [ ] **Step 3:** Update `package.json` test script to `"node --test src/libs/**/*.test.js src/content/*.test.js"`. Run `npm test` → FAIL (modules missing).

- [ ] **Step 4: Implement `src/content/validate.js`**

```js
import fs from "node:fs";
import path from "node:path";

export const SECTION_TYPES = ["homeHero", "richText", "features", "split", "steps", "stats", "faq", "cta", "cardsLinks"];

const ALLOWED_TAGS = new Set(["p", "h3", "h4", "ul", "ol", "li", "strong", "em", "a", "br"]);
const STATIC_ROUTES = ["/blogs", "/news", "/events", "/resources", "/careers", "/contact", "/book-consultation", "/partner-with-us", "/subscribe"];

export function knownRoutes(pages) {
	return new Set([...STATIC_ROUTES, ...pages.map(page => page.path)]);
}

export function iconNamesFromCss(css) {
	return new Set([...css.matchAll(/\.(tji-[a-z0-9-]+):before/g)].map(match => match[1]));
}

function checkHref(href, where, ctx, errors) {
	if (typeof href !== "string" || !href) return errors.push(`${where}: missing href`);
	if (/^(https:\/\/|mailto:|tel:)/.test(href)) return;
	if (!href.startsWith("/")) return errors.push(`${where}: link "${href}" must be internal or https/mailto/tel`);
	const route = href.split(/[?#]/)[0];
	if (!ctx.knownRoutes.has(route)) errors.push(`${where}: link "${href}" points to an unknown page`);
}

function checkHtml(html, where, ctx, errors) {
	if (typeof html !== "string" || !html.trim()) return errors.push(`${where}: html is required`);
	for (const match of html.matchAll(/<\/?([a-zA-Z0-9]+)([^>]*)>/g)) {
		const tag = match[1].toLowerCase();
		const attrs = match[2];
		if (!ALLOWED_TAGS.has(tag)) errors.push(`${where}: tag <${tag}> is not allowed`);
		const attrNames = [...attrs.matchAll(/([a-zA-Z-]+)\s*=/g)].map(m => m[1].toLowerCase());
		for (const name of attrNames) {
			if (!(tag === "a" && name === "href")) errors.push(`${where}: attribute "${name}" on <${tag}> is not allowed`);
		}
		if (tag === "a" && !match[0].startsWith("</")) {
			const href = attrs.match(/href\s*=\s*"([^"]*)"/)?.[1];
			checkHref(href, where, ctx, errors);
		}
	}
}

function checkText(value, field, where, errors, max) {
	if (typeof value !== "string" || !value.trim()) errors.push(`${where}: ${field} is required`);
	else if (max && value.length > max) errors.push(`${where}: ${field} must be ≤ ${max} characters`);
}

function checkImage(src, where, ctx, errors) {
	if (typeof src !== "string" || !src.startsWith("/images/")) return errors.push(`${where}: image must be a /images/... path`);
	if (!fs.existsSync(path.join(ctx.publicDir, src))) errors.push(`${where}: image ${src} does not exist`);
}

function checkIcon(icon, where, ctx, errors) {
	if (icon && !ctx.iconNames.has(icon)) errors.push(`${where}: unknown icon ${icon}`);
}

const SECTION_CHECKS = {
	homeHero(section, where, ctx, errors) {
		checkText(section.title, "title", where, errors);
		checkText(section.text, "text", where, errors);
		checkHref(section.primary?.href, `${where}.primary`, ctx, errors);
		checkText(section.primary?.label, "primary.label", where, errors);
		if (section.secondary) checkHref(section.secondary.href, `${where}.secondary`, ctx, errors);
		if (section.image) checkImage(section.image, where, ctx, errors);
	},
	richText(section, where, ctx, errors) {
		checkHtml(section.html, where, ctx, errors);
	},
	features(section, where, ctx, errors) {
		checkText(section.heading, "heading", where, errors);
		if (!Array.isArray(section.items) || !section.items.length) return errors.push(`${where}: items are required`);
		section.items.forEach((item, i) => {
			checkText(item.title, "title", `${where}.items[${i}]`, errors);
			checkText(item.text, "text", `${where}.items[${i}]`, errors);
			checkIcon(item.icon, `${where}.items[${i}]`, ctx, errors);
			if (item.href) checkHref(item.href, `${where}.items[${i}]`, ctx, errors);
		});
	},
	split(section, where, ctx, errors) {
		checkText(section.heading, "heading", where, errors);
		checkHtml(section.html, where, ctx, errors);
		checkImage(section.image, where, ctx, errors);
		checkText(section.imageAlt, "imageAlt", where, errors);
	},
	steps(section, where, ctx, errors) {
		checkText(section.heading, "heading", where, errors);
		if (!Array.isArray(section.items) || !section.items.length) return errors.push(`${where}: items are required`);
		section.items.forEach((item, i) => {
			checkText(item.title, "title", `${where}.items[${i}]`, errors);
			checkText(item.text, "text", `${where}.items[${i}]`, errors);
		});
	},
	stats(section, where, ctx, errors) {
		if (!Array.isArray(section.items) || !section.items.length) return errors.push(`${where}: items are required`);
		section.items.forEach((item, i) => {
			checkText(item.value, "value", `${where}.items[${i}]`, errors);
			checkText(item.label, "label", `${where}.items[${i}]`, errors);
		});
	},
	faq(section, where, ctx, errors) {
		checkText(section.heading, "heading", where, errors);
		if (!Array.isArray(section.items) || !section.items.length) return errors.push(`${where}: items are required`);
		section.items.forEach((item, i) => {
			checkText(item.question, "question", `${where}.items[${i}]`, errors);
			checkHtml(item.answer, `${where}.items[${i}].answer`, ctx, errors);
		});
	},
	cta(section, where, ctx, errors) {
		checkText(section.heading, "heading", where, errors);
		checkText(section.text, "text", where, errors);
		checkText(section.primary?.label, "primary.label", where, errors);
		checkHref(section.primary?.href, `${where}.primary`, ctx, errors);
		if (section.secondary) checkHref(section.secondary.href, `${where}.secondary`, ctx, errors);
	},
	cardsLinks(section, where, ctx, errors) {
		checkText(section.heading, "heading", where, errors);
		if (!Array.isArray(section.items) || !section.items.length) return errors.push(`${where}: items are required`);
		section.items.forEach((item, i) => {
			checkText(item.title, "title", `${where}.items[${i}]`, errors);
			checkText(item.text, "text", `${where}.items[${i}]`, errors);
			checkHref(item.href, `${where}.items[${i}]`, ctx, errors);
			if (item.image) checkImage(item.image, `${where}.items[${i}]`, ctx, errors);
		});
	},
};

export function validatePage(page, ctx) {
	const errors = [];
	const where = page?.path || "(no path)";
	if (typeof page?.path !== "string" || !page.path.startsWith("/")) errors.push(`${where}: path must start with /`);
	checkText(page?.title, "title", where, errors);
	checkText(page?.description, "description", where, errors, 160);
	if (page?.parent && !ctx.knownRoutes.has(page.parent)) errors.push(`${where}: unknown parent ${page.parent}`);
	if (page?.hero) {
		checkText(page.hero.title, "hero.title", where, errors);
		checkText(page.hero.text, "hero.text", where, errors);
	}
	if (!Array.isArray(page?.sections) || !page.sections.length) {
		errors.push(`${where}: sections are required`);
		return errors;
	}
	page.sections.forEach((section, i) => {
		const sectionWhere = `${where}: sections[${i}] (${section?.type})`;
		const check = SECTION_CHECKS[section?.type];
		if (!check) errors.push(`${sectionWhere}: unknown section type "${section?.type}"`);
		else check(section, sectionWhere, ctx, errors);
	});
	return errors;
}
```

- [ ] **Step 5: `scripts/import-images.mjs`**

```js
// Usage: node scripts/import-images.mjs <old-relative-src> <site-relative-dest> [...]
// e.g.  node scripts/import-images.mjs DPCM.1.png products/consent-management.webp
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OLD_IMAGES = "C:/Users/Vicky/Desktop/dpdp-WebSite/assets/images";
const DEST_ROOT = path.resolve("public/images/site");
const args = process.argv.slice(2);
if (!args.length || args.length % 2) {
	console.error("Pass pairs: <source> <dest.webp>");
	process.exit(1);
}

for (let i = 0; i < args.length; i += 2) {
	const source = path.join(OLD_IMAGES, args[i]);
	const dest = path.join(DEST_ROOT, args[i + 1]);
	if (!dest.endsWith(".webp")) throw new Error(`Destination must be .webp: ${args[i + 1]}`);
	fs.mkdirSync(path.dirname(dest), { recursive: true });
	await sharp(source).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toFile(dest);
	const kb = Math.round(fs.statSync(dest).size / 1024);
	console.log(`${args[i]} -> images/site/${args[i + 1]} (${kb} KB)`);
}
```
(SVG sources are rasterised by sharp; that's fine for illustrations. If a result is > 300 KB, rerun that image with `quality` 70 by editing locally, not in the committed script.)

- [ ] **Step 6: Section components** (all in `src/components/sections/page/`, server components unless noted). Use the template's heading markup (`sec-heading`, `sub-title` with `<i className="tji-box"></i>`, `sec-title`) and existing card classes.

`RichTextSection.js`
```js
// html comes from repo content files validated by src/content/validate.js.
const RichTextSection = ({ heading, html }) => (
	<section className="tj-page-section section-gap-2">
		<div className="container">
			<div className="row justify-content-center">
				<div className="col-lg-10">
					{heading ? (
						<div className="sec-heading">
							<h2 className="sec-title">{heading}</h2>
						</div>
					) : null}
					<div className="page-rich-text" dangerouslySetInnerHTML={{ __html: html }} />
				</div>
			</div>
		</div>
	</section>
);
export default RichTextSection;
```

`SectionHeading.js` (shared helper used by the others):
```js
const SectionHeading = ({ eyebrow, heading, intro, center = true }) => (
	<div className={`sec-heading ${center ? "text-center" : ""}`}>
		{eyebrow ? (
			<span className="sub-title">
				<i className="tji-box"></i>
				{eyebrow}
			</span>
		) : null}
		<h2 className="sec-title">{heading}</h2>
		{intro ? <p className="page-section-intro">{intro}</p> : null}
	</div>
);
export default SectionHeading;
```

`FeaturesSection.js`
```js
import Link from "next/link";
import SectionHeading from "./SectionHeading";

const FeaturesSection = ({ eyebrow, heading, intro, items }) => (
	<section className="tj-choose-section section-gap-2">
		<div className="container">
			<SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} />
			<div className="row row-gap-4">
				{items.map(item => (
					<div className="col-lg-4 col-md-6" key={item.title}>
						<div className="choose-box page-feature">
							<div className="choose-content">
								<div className="choose-icon">
									<i className={item.icon || "tji-service-1"}></i>
								</div>
								<h4 className="title">{item.title}</h4>
								<p className="desc">{item.text}</p>
								{item.href ? (
									<Link className="text-btn" href={item.href}>
										<span className="btn-text"><span>Learn More</span></span>
										<span className="btn-icon"><i className="tji-arrow-right-long"></i></span>
									</Link>
								) : null}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	</section>
);
export default FeaturesSection;
```

`SplitSection.js`
```js
import SectionHeading from "./SectionHeading";

const SplitSection = ({ eyebrow, heading, html, image, imageAlt, reverse }) => (
	<section className="tj-page-section section-gap-2">
		<div className="container">
			<div className={`row align-items-center row-gap-5 ${reverse ? "flex-row-reverse" : ""}`}>
				<div className="col-lg-6">
					<SectionHeading eyebrow={eyebrow} heading={heading} center={false} />
					<div className="page-rich-text" dangerouslySetInnerHTML={{ __html: html }} />
				</div>
				<div className="col-lg-6">
					<img className="page-split-image" src={image} alt={imageAlt} loading="lazy" />
				</div>
			</div>
		</div>
	</section>
);
export default SplitSection;
```

`StepsSection.js`
```js
import SectionHeading from "./SectionHeading";

const StepsSection = ({ eyebrow, heading, intro, items }) => (
	<section className="tj-page-section page-steps-section section-gap-2">
		<div className="container">
			<SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} />
			<ol className="page-steps">
				{items.map((item, idx) => (
					<li className="page-step" key={item.title}>
						<span className="page-step-number">{String(idx + 1).padStart(2, "0")}</span>
						<h4 className="page-step-title">{item.title}</h4>
						<p className="page-step-text">{item.text}</p>
					</li>
				))}
			</ol>
		</div>
	</section>
);
export default StepsSection;
```

`StatsSection.js`
```js
const StatsSection = ({ items }) => (
	<section className="tj-page-section section-gap-2">
		<div className="container">
			<div className="page-stats">
				{items.map(item => (
					<div className="page-stat" key={item.label}>
						<span className="page-stat-value">{item.value}</span>
						<span className="page-stat-label">{item.label}</span>
					</div>
				))}
			</div>
		</div>
	</section>
);
export default StatsSection;
```

`FaqSection.js` — accordion with ids unique per section (`idPrefix` from the renderer):
```js
import SectionHeading from "./SectionHeading";

const FaqSection = ({ eyebrow, heading, items, idPrefix }) => (
	<section className="tj-faq-section section-gap-2">
		<div className="container">
			<SectionHeading eyebrow={eyebrow} heading={heading} />
			<div className="row justify-content-center">
				<div className="col-lg-10">
					<div className="accordion tj-faq" id={`${idPrefix}-faq`}>
						{items.map((item, idx) => {
							const id = `${idPrefix}-faq-${idx}`;
							return (
								<div className="accordion-item" key={id}>
									<button
										className={`faq-title ${idx === 0 ? "" : "collapsed"}`}
										type="button"
										data-bs-toggle="collapse"
										data-bs-target={`#${id}`}
										aria-expanded={idx === 0}
										aria-controls={id}
									>
										{item.question}
									</button>
									<div id={id} className={`collapse ${idx === 0 ? "show" : ""}`} data-bs-parent={`#${idPrefix}-faq`}>
										<div className="accordion-body faq-text" dangerouslySetInnerHTML={{ __html: item.answer }} />
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	</section>
);
export default FaqSection;
```

`CtaSection.js`
```js
import ButtonPrimary from "@/components/shared/buttons/ButtonPrimary";

const CtaSection = ({ heading, text, primary, secondary }) => (
	<section className="tj-page-section section-gap-2">
		<div className="container">
			<div className="page-cta">
				<div className="page-cta-content">
					<h2 className="page-cta-title">{heading}</h2>
					<p className="page-cta-text">{text}</p>
				</div>
				<div className="page-cta-actions">
					<ButtonPrimary text={primary.label} url={primary.href} />
					{secondary ? <ButtonPrimary text={secondary.label} url={secondary.href} isTextBtn={true} /> : null}
				</div>
			</div>
		</div>
	</section>
);
export default CtaSection;
```

`CardsLinksSection.js`
```js
import Link from "next/link";
import SectionHeading from "./SectionHeading";

const CardsLinksSection = ({ eyebrow, heading, intro, items }) => (
	<section className="tj-page-section section-gap-2">
		<div className="container">
			<SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} />
			<div className="row row-gap-4">
				{items.map(item => (
					<div className="col-lg-4 col-md-6" key={item.href}>
						<Link className="page-link-card" href={item.href}>
							{item.image ? <img src={item.image} alt="" loading="lazy" /> : null}
							<div className="page-link-card-body">
								<h4 className="title">{item.title}</h4>
								<p>{item.text}</p>
								<span className="text-btn">
									<span className="btn-text"><span>Learn More</span></span>
									<span className="btn-icon"><i className="tji-arrow-right-long"></i></span>
								</span>
							</div>
						</Link>
					</div>
				))}
			</div>
		</div>
	</section>
);
export default CardsLinksSection;
```

`HomeHeroSection.js`
```js
import ButtonPrimary from "@/components/shared/buttons/ButtonPrimary";

const HomeHeroSection = ({ eyebrow, title, text, primary, secondary, image }) => (
	<section className="page-home-hero section-gap-x">
		<div className="container">
			<div className="row align-items-center row-gap-5">
				<div className={image ? "col-lg-6" : "col-lg-9"}>
					{eyebrow ? (
						<span className="sub-title">
							<i className="tji-box"></i>
							{eyebrow}
						</span>
					) : null}
					<h1 className="page-home-hero-title">{title}</h1>
					<p className="page-home-hero-text">{text}</p>
					<div className="page-home-hero-actions">
						<ButtonPrimary text={primary.label} url={primary.href} />
						{secondary ? <ButtonPrimary text={secondary.label} url={secondary.href} isTextBtn={true} /> : null}
					</div>
				</div>
				{image ? (
					<div className="col-lg-6">
						<img className="page-home-hero-image" src={image} alt="" />
					</div>
				) : null}
			</div>
		</div>
	</section>
);
export default HomeHeroSection;
```

`PageRenderer.js`
```js
import CardsLinksSection from "./CardsLinksSection";
import CtaSection from "./CtaSection";
import FaqSection from "./FaqSection";
import FeaturesSection from "./FeaturesSection";
import HomeHeroSection from "./HomeHeroSection";
import RichTextSection from "./RichTextSection";
import SplitSection from "./SplitSection";
import StatsSection from "./StatsSection";
import StepsSection from "./StepsSection";

const COMPONENTS = {
	homeHero: HomeHeroSection,
	richText: RichTextSection,
	features: FeaturesSection,
	split: SplitSection,
	steps: StepsSection,
	stats: StatsSection,
	faq: FaqSection,
	cta: CtaSection,
	cardsLinks: CardsLinksSection,
};

const PageRenderer = ({ sections }) =>
	sections.map((section, idx) => {
		const Component = COMPONENTS[section.type];
		if (!Component) {
			if (process.env.NODE_ENV !== "production") console.warn(`Unknown section type: ${section.type}`);
			return null;
		}
		const { type, ...props } = section;
		return <Component key={`${type}-${idx}`} idPrefix={`s${idx}`} {...props} />;
	});

export default PageRenderer;
```

`ContentPage.js`
```js
import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";
import HeroInner from "@/components/sections/hero/HeroInner";
import BackToTop from "@/components/shared/others/BackToTop";
import HeaderSpace from "@/components/shared/others/HeaderSpace";
import ClientWrapper from "@/components/shared/wrappers/ClientWrapper";
import { getPage } from "@/content/pages";
import PageRenderer from "./PageRenderer";

const ContentPage = ({ page }) => {
	const parent = page.parent ? getPage(page.parent) : null;
	return (
		<div>
			<BackToTop />
			<Header />
			<Header isStickyHeader={true} />
			<div id="smooth-wrapper">
				<div id="smooth-content">
					<main>
						<HeaderSpace />
						{page.hero ? (
							<HeroInner
								title={page.hero.title}
								text={page.hero.title}
								breadcrums={parent ? [{ name: parent.title, path: parent.path }] : []}
							/>
						) : null}
						{page.hero?.text ? (
							<section className="page-hero-intro">
								<div className="container">
									<p>{page.hero.text}</p>
								</div>
							</section>
						) : null}
						<PageRenderer sections={page.sections} />
					</main>
					<Footer />
				</div>
			</div>
			<ClientWrapper />
		</div>
	);
};

export default ContentPage;
```
Add the `@/content/*` alias if `jsconfig.json`'s `@/*` → `src/*` doesn't already cover it (it does: `@/content/pages` → `src/content/pages`).

- [ ] **Step 7: Registry and pilot page.**
`src/content/pages/index.js`:
```js
import dpdpActPenaltiesAndFines from "./dpdp-act-penalties-and-fines.js";

export const PAGES = [dpdpActPenaltiesAndFines];

const BY_PATH = new Map(PAGES.map(page => [page.path, page]));

export function getPage(path) {
	return BY_PATH.get(path) || null;
}

export function childPages(prefix) {
	return PAGES.filter(page => page.path.startsWith(`${prefix}/`));
}
```
Pilot `dpdp-act-penalties-and-fines.js`: migrate `C:\Users\Vicky\Desktop\dpdp-WebSite\administrative-fines-and-penalties.php` per the Content Migration Rules below (`path: "/dpdp-act/penalties-and-fines"`, `parent` omitted until the `/dpdp-act` overview exists in Task 3). End with a `cta` → `/book-consultation`.

Every content file must end with `.js`, `export default {...}`, and import nothing (pure data).

- [ ] **Step 8: Route file** `src/app/dpdp-act/[slug]/page.js`:
```js
import ContentPage from "@/components/sections/page/ContentPage";
import { childPages, getPage } from "@/content/pages";
import { notFound } from "next/navigation";

export function generateStaticParams() {
	return childPages("/dpdp-act").map(page => ({ slug: page.path.split("/").pop() }));
}

export async function generateMetadata({ params }) {
	const { slug } = await params;
	const page = getPage(`/dpdp-act/${slug}`);
	return page ? { title: `${page.title} | DPDP Consultants`, description: page.description } : {};
}

export default async function DpdpActChildPage({ params }) {
	const { slug } = await params;
	const page = getPage(`/dpdp-act/${slug}`);
	if (!page) notFound();
	return <ContentPage page={page} />;
}
```

- [ ] **Step 9: Styles** `src/app/assets/sass/layout/_page.scss`, forwarded in `globals.scss` after `content`: `.page-hero-intro` (centered 18px lead paragraph, max-width 820px, margin 40px auto 0), `.page-rich-text` (p margin-bottom 18px; h3/h4 margins; ul/ol padding-left 22px, li margin-bottom 8px; links underlined in theme primary), `.page-section-intro` (max-width 720px, centered, muted), `.page-feature` full height, `.page-split-image` (width 100%, radius 12px), `.page-steps` (list-style none, padding 0, grid 1–3 columns responsive, gap 24px) with `.page-step` card (white, radius 12px, padding 28px), `.page-step-number` (theme primary, 32px bold), `.page-stats` (flex wrap, 2–4 columns, center) with `.page-stat-value` (44px, heading colour, bold) and `.page-stat-label` (muted), `.page-cta` (flex, space-between, wrap, gap 24px, padding 48px, radius 16px, background `var(--tj-color-theme-dark)`, white text), `.page-link-card` (block, white, radius 12px, overflow hidden, height 100%, img cover 200px tall, body padding 24px, hover lift), `.page-home-hero` (padding 80px 0 60px; title 56px/1.1, 40px ≤ lg, 34px ≤ md; text 19px; actions gap 16px; image radius 16px). Use existing variables (`--tj-color-*`, breakpoints `$lg`, `$md`, `$sm`, `$xs`).

- [ ] **Step 10: Verify.** `npm test` → PASS (validator tests + pilot page valid). `npx next build` → compiles; `/dpdp-act/[slug]` listed.

- [ ] **Step 11: Commit**
```bash
git add src/content src/components/sections/page src/app/assets/sass src/app/globals.scss src/app/dpdp-act scripts/import-images.mjs package.json public/images/site
git commit -m "Add data-driven content page engine with validation and a pilot page"
```

#### Content Migration Rules (apply in every content task)

1. Open the source PHP file(s) named in the task. Extract only the page's own visible copy: headings, paragraphs, list items, table cells, FAQ question/answers. Ignore PHP, `include`d nav/footer/forms, scripts, styles, tracking and hidden elements.
2. Title/description: use the old `<title>` / `$metatitle` and meta description / `$metadesc` (trim description to ≤ 160 chars at a word boundary).
3. Map structure to sections: opening paragraphs → `richText` (or `split` when the old page shows an illustration beside them); cards/benefit lists → `features` (pick fitting allowed icons); numbered process → `steps`; Q&A → `faq`; closing → `cta` to `/book-consultation` (secondary `/contact`). Overview pages add a `cardsLinks` section to every child page.
4. Keep wording; fix spelling/grammar and product names only. Never add facts, numbers, client names, certifications, dates or legal interpretation that the old page doesn't contain. If the old page is thin, the new page is short.
5. Images: at most 2 per page, only ones the old page shows; import with `scripts/import-images.mjs` into `public/images/site/<section>/<page>.webp` (commit the WebP outputs only).
6. After adding pages: register them in `src/content/pages/index.js`, run `npm test` (must be green) and `npx next build`.

---

### Task 2: Navigation, header CTA and footer

**Files:**
- Create: `src/content/navigation.js`
- Modify: `src/components/layout/header/Navbar.js`, `MobileNavbar.js`, `Header.js` (CTA only), `src/hooks/useActiveLink.js`, `src/components/layout/footer/Footer.js` (link columns only)
- Delete (only if nothing else imports them after the change — check with grep): `src/libs/getNavItems.js`, `public/fakedata/nav-items.json`

**Interfaces:**
- Produces: `NAVIGATION: [{ label, href, children?: [{ label, href }] }]`, `FOOTER_LINKS: [{ heading, links: [{ label, href }] }]`; `useActiveLink()` returning `isActive(item)`.

- [ ] **Step 1: `src/content/navigation.js`**
```js
export const NAVIGATION = [
	{ label: "Home", href: "/" },
	{
		label: "DPDP Act",
		href: "/dpdp-act",
		children: [
			{ label: "DPDP Act 2023", href: "/dpdp-act" },
			{ label: "DPDP Rules 2025", href: "/dpdp-act/dpdp-rules-2025" },
			{ label: "Penalties & Fines", href: "/dpdp-act/penalties-and-fines" },
			{ label: "Third-Party & Processor Obligations", href: "/dpdp-act/third-party-obligations" },
			{ label: "DPDPA & Business Continuity", href: "/dpdp-act/business-continuity" },
		],
	},
	{
		label: "Products",
		href: "/products",
		children: [
			{ label: "All Compliance Tools", href: "/products" },
			{ label: "Consent Management", href: "/products/consent-management" },
			{ label: "Rights & Grievance Redressal", href: "/products/grievance-redressal" },
			{ label: "Awareness Program", href: "/products/awareness-program" },
			{ label: "Impact Assessment", href: "/products/impact-assessment" },
			{ label: "Third-Party Risk Assessment", href: "/products/third-party-assessment" },
			{ label: "Cookie Consent", href: "/products/cookie-consent" },
		],
	},
	{
		label: "Services",
		href: "/services",
		children: [
			{ label: "All Services", href: "/services" },
			{ label: "Gap Assessment & Readiness Review", href: "/services/gap-assessment" },
			{ label: "DPO as a Service", href: "/services/dpo-as-a-service" },
			{ label: "Contract Review & DPAs", href: "/services/contract-review" },
			{ label: "Consulting, Advisory & Audit", href: "/services/consulting-advisory-audit" },
			{ label: "Training Programs", href: "/services/training-programs" },
			{ label: "DPDP Act Foundation Course", href: "/services/dpdp-act-foundation-course" },
		],
	},
	{
		label: "Resources",
		href: "/resources",
		children: [
			{ label: "Blogs", href: "/blogs" },
			{ label: "News", href: "/news" },
			{ label: "Webinars & Events", href: "/events" },
			{ label: "Whitepapers & Guides", href: "/resources" },
			{ label: "Case Studies", href: "/case-studies" },
		],
	},
	{
		label: "Company",
		href: "/about",
		children: [
			{ label: "About Us", href: "/about" },
			{ label: "Careers", href: "/careers" },
			{ label: "Partner With Us", href: "/partner-with-us" },
			{ label: "Contact Us", href: "/contact" },
		],
	},
];

export const FOOTER_LINKS = [
	{
		heading: "Company",
		links: [
			{ label: "About Us", href: "/about" },
			{ label: "Careers", href: "/careers" },
			{ label: "Partner With Us", href: "/partner-with-us" },
			{ label: "Contact Us", href: "/contact" },
		],
	},
	{
		heading: "Resources",
		links: [
			{ label: "Blogs", href: "/blogs" },
			{ label: "News", href: "/news" },
			{ label: "Webinars & Events", href: "/events" },
			{ label: "Whitepapers & Guides", href: "/resources" },
		],
	},
	{
		heading: "Legal",
		links: [
			{ label: "FAQs", href: "/faq" },
			{ label: "Privacy Notice", href: "/privacy-notice" },
			{ label: "Terms & Conditions", href: "/terms-and-conditions" },
		],
	},
];
```
(Pages that don't exist yet will 404 until their task lands; the Task 8 smoke confirms all.)

- [ ] **Step 2: `useActiveLink.js`** — replace with:
```js
"use client";
import { usePathname } from "next/navigation";

// A top-level item is active when the current path is its href, or any of
// its children's hrefs, or sits under one of them (e.g. /blogs/some-post).
export default function useActiveLink() {
	const pathname = usePathname() || "/";
	const matches = href => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
	return item => matches(item.href) || Boolean(item.children?.some(child => matches(child.href)));
}
```

- [ ] **Step 3: `Navbar.js`** — replace the hard-coded menus with a loop (keep the outer `menu-area` / `nav#mobile-menu.mainmenu` markup the CSS expects):
```js
"use client";
import useActiveLink from "@/hooks/useActiveLink";
import { NAVIGATION } from "@/content/navigation";
import Link from "next/link";

const Navbar = () => {
	const isActive = useActiveLink();
	return (
		<div className="menu-area d-none d-lg-inline-flex align-items-center">
			<nav id="mobile-menu" className="mainmenu">
				<ul>
					{NAVIGATION.map(item => (
						<li
							key={item.label}
							className={`${item.children ? "has-dropdown" : ""} ${isActive(item) ? "current-menu-ancestor" : ""}`}
						>
							<Link href={item.href}>{item.label}</Link>
							{item.children ? (
								<ul className="sub-menu">
									{item.children.map(child => (
										<li key={child.href + child.label}>
											<Link href={child.href}>{child.label}</Link>
										</li>
									))}
								</ul>
							) : null}
						</li>
					))}
				</ul>
			</nav>
		</div>
	);
};

export default Navbar;
```
Check how `Header.js` passes props to `Navbar` and keep the call compatible.

- [ ] **Step 4: `MobileNavbar.js`** — keep the outer hamburger/`mean-bar`/`mean-nav` markup and any contact/social blocks it renders below the menu; replace the six hard-coded `MobileMenuItem`s with:
```jsx
{NAVIGATION.map(item =>
	item.children ? (
		<MobileMenuItem key={item.label} text={item.label} url={item.href}>
			{item.children.map(child => (
				<li key={child.href + child.label}>
					<Link href={child.href}>{child.label}</Link>
				</li>
			))}
		</MobileMenuItem>
	) : (
		<li key={item.label}>
			<Link href={item.href}>{item.label}</Link>
		</li>
	)
)}
```

- [ ] **Step 5: Header CTA** — in `Header.js` change `<ButtonPrimary text={"Let’s Talk"} url={"/contact"} />` to `<ButtonPrimary text={"Book a Consultation"} url={"/book-consultation"} />`.

- [ ] **Step 6: Footer** — in `src/components/layout/footer/Footer.js` replace the existing link-list widgets' hard-coded `<li><Link>` items with loops over `FOOTER_LINKS` (one widget per group, keeping the existing widget markup/classes: heading element and `ul`). Leave the contact details, socials, newsletter box and copyright untouched.

- [ ] **Step 7:** Remove `getNavItems.js` and `nav-items.json` if `grep -rn "getNavItems\|nav-items" src` finds no remaining users. `npx next build` → compiles. `npm test` → PASS.

- [ ] **Step 8: Commit**
```bash
git add src/content/navigation.js src/components/layout src/hooks/useActiveLink.js src/libs public/fakedata
git commit -m "Replace template menus with the DPDP navigation and footer links"
```

---

### Task 3: DPDP Act pages

**Files:** `src/content/pages/dpdp-act.js` (`/dpdp-act`), `dpdp-act-dpdp-rules-2025.js`, `dpdp-act-third-party-obligations.js`, `dpdp-act-business-continuity.js`; update the pilot page with `parent: "/dpdp-act"`; `src/app/dpdp-act/page.js`; register in `index.js`; images under `public/images/site/dpdp-act/`.

Sources: `what-is-dpdpa.php` (overview), `draft-dpdp-rules-2025.php`, `subcontractor-and-thrid-party-issues.php`, `dpdpa-and-business-discontiniuity.php`.

- [ ] Apply the Content Migration Rules. The overview ends with `cardsLinks` to the four child pages. Child pages set `parent: "/dpdp-act"`. The Rules page must keep the old page's framing (e.g. if it calls them draft rules, keep "draft"); do not update facts from your own knowledge.
- [ ] `src/app/dpdp-act/page.js`:
```js
import ContentPage from "@/components/sections/page/ContentPage";
import { getPage } from "@/content/pages";

const page = getPage("/dpdp-act");
export const metadata = { title: `${page.title} | DPDP Consultants`, description: page.description };
export default function DpdpActPage() {
	return <ContentPage page={page} />;
}
```
- [ ] `npm test` green, `npx next build` compiles. Commit: `git commit -m "Add DPDP Act pages migrated from the old site"`.

---

### Task 4: Product pages

**Files:** `src/content/pages/products.js` (`/products`), `products-consent-management.js`, `products-grievance-redressal.js`, `products-awareness-program.js`, `products-impact-assessment.js`, `products-third-party-assessment.js`, `products-cookie-consent.js`; `src/app/products/page.js` (like `/dpdp-act/page.js`) and `src/app/products/[slug]/page.js` (like the dpdp-act slug route, prefix `/products`); images under `public/images/site/products/`.

Sources: `compliance-tools.php`, `dpcm.php` (+ `data-principal-consent-management.php` if it has additional copy), `dpgr.php` (+ `data-principal-rights-and-grievance-redressal.php`), `dpap.php` (+ `data-protection-awareness-program.php`), `dpia.php` (+ `data-protection-impact-assessment.php`), `dptpa.php` (+ `data-protection-third-party-assessment.php`), `cookie-consent-management.php`. Candidate images: `DPCM.1.png`, `DPGR.1.png`, `DPAP.1.png`, `DPIA.1.png`, `DPTPA.1.png`, `cookie/…`, `*-tool.svg`.

- [ ] Apply the Content Migration Rules. Product pages should be product-led: a `split` intro with the product image, `features` for capabilities, `steps` if the old page describes how it works, `cta` → `/book-consultation` with primary label "Book a Demo". Overview `/products` ends with `cardsLinks` to the six products (with their images). Child pages `parent: "/products"`.
- [ ] `npm test` green, `npx next build` compiles. Commit: `git commit -m "Add product pages migrated from the old site"`.

---

### Task 5: Service pages

**Files:** `src/content/pages/services.js` (`/services`), `services-gap-assessment.js`, `services-dpo-as-a-service.js`, `services-contract-review.js`, `services-consulting-advisory-audit.js`, `services-training-programs.js`, `services-dpdp-act-foundation-course.js`; replace the template's `src/app/services/page.js` and `src/app/services/[id]/page.js` with `src/app/services/page.js` and `src/app/services/[slug]/page.js` (content-driven, prefix `/services`; delete the `[id]` folder); images under `public/images/site/services/`.

Sources: `services.php`, `readiness-review.php`, `data-protection-officer-as-a-service.php`, `contract-review-data-processing-agreements.php`, `consulting-advisory-and-audit.php`, `training-programs-for-DPDPA-compliance.php`, `dpdp-act-foundation-course.php`.

- [ ] Apply the Content Migration Rules. The Foundation Course page's `cta` primary → `/contact` labelled "Enquire About the Course" (no course-booking flow exists), secondary → `/book-consultation`. Overview ends with `cardsLinks` to the six services.
- [ ] Check nothing else in `src/` links to `/services/1`-style ids (`grep -rn "/services/\${\|/services/[0-9]" src`) and point those links at `/services`.
- [ ] `npm test` green, `npx next build` compiles. Commit: `git commit -m "Add service pages migrated from the old site"`.

---

### Task 6: About, Case Studies, FAQ, Privacy Notice, Terms

**Files:** `src/content/pages/about.js` (`/about`), `case-studies.js` (`/case-studies`), `faq.js` (`/faq`), `privacy-notice.js` (`/privacy-notice`), `terms-and-conditions.js` (`/terms-and-conditions`); route files `src/app/about/page.js` (replace the template page), `src/app/case-studies/page.js`, `src/app/faq/page.js` (replace), `src/app/privacy-notice/page.js`, `src/app/terms-and-conditions/page.js` (replace); images under `public/images/site/company/`.

Sources: `about-us.php` (sections: who we are, mission & vision, our team, what we do, awards & certifications), `case-study.php`, `faq.php`, `privacyium-privacy-policy.php`, `terms-and-conditions.php`.

- [ ] Apply the Content Migration Rules. About: team members only as listed on the old page, names and roles exactly as there, rendered as one `features` section (heading "Our Team", each item `title` = name, `text` = role, icon `tji-user`); no photos. Awards: only those named on the old page. FAQ: every Q&A from `faq.php` into one or more `faq` sections grouped as the old page groups them. Privacy Notice and Terms: `richText` sections, text verbatim (headings → `h3`), `hero.text` a one-line summary.
- [ ] `npm test` green, `npx next build` compiles. Commit: `git commit -m "Add About, Case Studies, FAQ and legal pages"`.

---

### Task 7: Home page

**Files:** `src/content/pages/home.js` (`path: "/"`, `hero: null`), modify `src/app/page.js` to render `ContentPage` (metadata from the page), images under `public/images/site/home/`.

Source: `index.php` (and `index.php`'s hero/sections only).

- [ ] Sections in order: `homeHero` (company positioning from the old hero; primary "Book a Consultation" → `/book-consultation`, secondary "Explore Products" → `/products`; image from the old hero if suitable), `features` (products — six cards linking to product pages, text from the old home/product copy), `features` (services — six cards linking to service pages), `split` (why DPDP Consultants / about teaser → `/about` link in the HTML), `stats` (only figures that appear on the old site; omit the section if none), `cardsLinks` (Blogs, News, Webinars & Events, Resources — short descriptions), `cta`.
- [ ] `ContentPage` with `hero: null` renders no page header — confirm the home layout still has the header spacer (`HeaderSpace`).
- [ ] `npm test` green, `npx next build` compiles. Commit: `git commit -m "Rebuild the home page from real content"`.

---

### Task 8: Template cleanup and site smoke

**Files:** delete route folders `src/app/{home-02,home-03,home-04,home-05,home-06,home-07,home-08,home-09,home-10,home-11,shop,cart,checkout,wishlist,portfolios,pricing-plan,our-gallery,history,team,coming-soon,blog-grid,blog-list,blog-sidebar,login,password,error}`; delete components/libs/fakedata that are no longer imported anywhere.

- [ ] Delete the route folders. Then iteratively: `npx next build`; for each component/lib/fakedata file, `grep -rln "<basename>" src` — delete only files with zero importers (repeat until stable). Never delete anything under `src/components/sections/page`, `src/content`, contacts, content, blogs detail used by `/blogs`, careers, header/footer, shared buttons/wrappers used by live pages.
- [ ] `grep -rn "href=\"/\(shop\|cart\|checkout\|wishlist\|portfolios\|pricing-plan\|our-gallery\|history\|team\|coming-soon\|blog-grid\|blog-list\|blog-sidebar\|home-0\|home-1\)" src` → no results (fix any remaining links to point at real pages).
- [ ] Smoke on spare ports (never :4000/:5000): backend `cd backend && PORT=5055 node src/server.js`, site `BACKEND_URL=http://localhost:5055 npx next start -p 4010`. `curl` every sitemap URL (all 36 minus dynamic detail pages) → 200; `/shop`, `/home-02`, `/portfolios` → the 404 page; `curl -s http://localhost:4010/ | grep -c "Book a Consultation"` ≥ 1 and the six menu labels present. Stop only your processes.
- [ ] `npm test` green. Commit: `git commit -m "Remove template demo pages and unused components"`.
