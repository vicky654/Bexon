import fs from "node:fs";
import path from "node:path";

export const SECTION_TYPES = ["homeHero", "richText", "features", "split", "steps", "stats", "faq", "cta", "cardsLinks", "marquee"];

const ALLOWED_TAGS = new Set(["p", "h3", "h4", "ul", "ol", "li", "strong", "em", "a", "br"]);
const STATIC_ROUTES = ["/", "/blogs", "/news", "/events", "/resources", "/careers", "/contact", "/book-consultation", "/partner-with-us", "/subscribe"];

export function knownRoutes(pages) {
	return new Set([...STATIC_ROUTES, ...pages.map(page => page.path)]);
}

export function iconNamesFromCss(css) {
	return new Set([...css.matchAll(/\.(tji-[a-z0-9-]+):before/g)].map(match => match[1]));
}

function checkHref(href, where, ctx, errors) {
	if (typeof href !== "string" || !href) return errors.push(`${where}: missing href`);
	// An href taken from parsed HTML is decoded by the browser before navigation, so any
	// character entity other than the literal-ampersand escape "&amp;" (e.g. "&colon;",
	// "&#58;", "&#x3a;") could smuggle a "javascript:" (or similar) scheme past the checks
	// below. Reject any such entity outright rather than trying to enumerate them.
	if (/&(?!amp;)/.test(href)) return errors.push(`${where}: link "${href}" contains a disallowed character entity`);
	if (/^(https:\/\/|mailto:|tel:)/.test(href)) return;
	if (!href.startsWith("/")) return errors.push(`${where}: link "${href}" must be internal or https/mailto/tel`);
	const route = href.split(/[?#]/)[0];
	if (!ctx.knownRoutes.has(route)) errors.push(`${where}: link "${href}" points to an unknown page`);
}

const isSpace = ch => ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\f";
const isNameChar = ch => /[a-zA-Z0-9]/.test(ch || "");
const isAttrNameChar = ch => /[a-zA-Z-]/.test(ch || "");

// checkHtml is the only guard standing in front of dangerouslySetInnerHTML, so it hand-parses
// the markup with a small tokenizer instead of matching tags with a regex: every "<" must open
// a well-formed "<name ...>" / "</name>" for a name in ALLOWED_TAGS and close with ">" before
// the string ends, or it is rejected — including "<!--" comments, "<!DOCTYPE" and other "<!...>"
// markup, a stray "<", and a tag left unclosed at the end of the string. Content that needs a
// literal "<" character must write the HTML entity "&lt;" instead.
function checkHtml(html, where, ctx, errors) {
	if (typeof html !== "string" || !html.trim()) return errors.push(`${where}: html is required`);
	const n = html.length;
	let i = 0;
	while (i < n) {
		if (html[i] !== "<") {
			i++;
			continue;
		}
		if (html.startsWith("<!--", i)) {
			errors.push(`${where}: comments are not allowed`);
			const end = html.indexOf("-->", i);
			i = end === -1 ? n : end + 3;
			continue;
		}
		if (html[i + 1] === "!") {
			errors.push(`${where}: "<!...>" markup is not allowed`);
			const end = html.indexOf(">", i);
			i = end === -1 ? n : end + 1;
			continue;
		}
		const closing = html[i + 1] === "/";
		let pos = i + (closing ? 2 : 1);
		const nameStart = pos;
		while (pos < n && isNameChar(html[pos])) pos++;
		const name = html.slice(nameStart, pos).toLowerCase();
		if (!name) {
			errors.push(`${where}: stray "<"`);
			i++;
			continue;
		}
		if (closing) {
			while (pos < n && isSpace(html[pos])) pos++;
			if (html[pos] !== ">") {
				errors.push(`${where}: malformed closing tag </${name}>`);
				const end = html.indexOf(">", pos);
				i = end === -1 ? n : end + 1;
				continue;
			}
			if (!ALLOWED_TAGS.has(name)) errors.push(`${where}: tag <${name}> is not allowed`);
			i = pos + 1;
			continue;
		}
		if (!ALLOWED_TAGS.has(name)) errors.push(`${where}: tag <${name}> is not allowed`);
		const attrs = {};
		let unclosed = false;
		for (;;) {
			while (pos < n && isSpace(html[pos])) pos++;
			if (pos >= n) {
				unclosed = true;
				break;
			}
			if (html[pos] === ">") {
				pos++;
				break;
			}
			if (html[pos] === "/" && html[pos + 1] === ">") {
				pos += 2;
				break;
			}
			const attrNameStart = pos;
			while (pos < n && isAttrNameChar(html[pos])) pos++;
			if (pos === attrNameStart) {
				errors.push(`${where}: malformed attribute in <${name}>`);
				pos++;
				continue;
			}
			const attrName = html.slice(attrNameStart, pos).toLowerCase();
			let value = "";
			let p2 = pos;
			while (p2 < n && isSpace(html[p2])) p2++;
			if (html[p2] === "=") {
				p2++;
				while (p2 < n && isSpace(html[p2])) p2++;
				const quote = html[p2];
				if (quote === '"' || quote === "'") {
					const valStart = p2 + 1;
					const endQuote = html.indexOf(quote, valStart);
					if (endQuote === -1) {
						errors.push(`${where}: unterminated attribute value in <${name}>`);
						unclosed = true;
						break;
					}
					value = html.slice(valStart, endQuote);
					pos = endQuote + 1;
				} else {
					const valStart = p2;
					let vp = p2;
					while (vp < n && !isSpace(html[vp]) && html[vp] !== ">") vp++;
					value = html.slice(valStart, vp);
					pos = vp;
				}
			}
			if (attrName in attrs) errors.push(`${where}: duplicate attribute "${attrName}" on <${name}>`);
			attrs[attrName] = value;
			if (!(name === "a" && attrName === "href")) errors.push(`${where}: attribute "${attrName}" on <${name}> is not allowed`);
		}
		if (unclosed) {
			errors.push(`${where}: unclosed tag <${name}>`);
			i = n;
			continue;
		}
		if (name === "a") {
			if (!("href" in attrs)) errors.push(`${where}: <a> requires href`);
			else checkHref(attrs.href, where, ctx, errors);
		}
		i = pos;
	}
}

function checkText(value, field, where, errors, max) {
	if (typeof value !== "string" || !value.trim()) errors.push(`${where}: ${field} is required`);
	else if (max && value.length > max) errors.push(`${where}: ${field} must be ≤ ${max} characters`);
}

function checkImage(src, where, ctx, errors) {
	if (typeof src !== "string" || !src.startsWith("/images/")) return errors.push(`${where}: image must be a /images/... path`);
	if (src.includes("..") || src.includes("\\")) return errors.push(`${where}: image path "${src}" is not allowed`);
	if (!fs.existsSync(path.join(ctx.publicDir, src))) errors.push(`${where}: image ${src} does not exist`);
}

function checkIcon(icon, where, ctx, errors) {
	if (icon && !ctx.iconNames.has(icon)) errors.push(`${where}: unknown icon ${icon}`);
}

function checkSecondary(secondary, where, ctx, errors) {
	if (!secondary) return;
	checkText(secondary.label, "secondary.label", where, errors);
	checkHref(secondary.href, `${where}.secondary`, ctx, errors);
}

function checkItem(item, where, errors) {
	if (!item || typeof item !== "object" || Array.isArray(item)) {
		errors.push(`${where}: item must be an object`);
		return false;
	}
	return true;
}

const SECTION_CHECKS = {
	homeHero(section, where, ctx, errors) {
		checkText(section.title, "title", where, errors);
		checkText(section.text, "text", where, errors);
		checkHref(section.primary?.href, `${where}.primary`, ctx, errors);
		checkText(section.primary?.label, "primary.label", where, errors);
		checkSecondary(section.secondary, where, ctx, errors);
		if (section.image) checkImage(section.image, where, ctx, errors);
		if (section.highlight !== undefined) {
			checkText(section.highlight, "highlight", where, errors);
			if (typeof section.highlight === "string" && typeof section.title === "string" && !section.title.includes(section.highlight))
				errors.push(`${where}: highlight must be part of the title`);
		}
		if (section.badges !== undefined) {
			if (!Array.isArray(section.badges)) errors.push(`${where}: badges must be a list`);
			else section.badges.forEach((badge, i) => checkText(badge, `badges[${i}]`, where, errors, 60));
		}
	},
	richText(section, where, ctx, errors) {
		checkHtml(section.html, where, ctx, errors);
	},
	features(section, where, ctx, errors) {
		checkText(section.heading, "heading", where, errors);
		if (section.variant !== undefined && section.variant !== "dark") errors.push(`${where}: variant must be "dark"`);
		if (section.numbered !== undefined && typeof section.numbered !== "boolean") errors.push(`${where}: numbered must be true or false`);
		if (!Array.isArray(section.items) || !section.items.length) return errors.push(`${where}: items are required`);
		section.items.forEach((item, i) => {
			const itemWhere = `${where}.items[${i}]`;
			if (!checkItem(item, itemWhere, errors)) return;
			checkText(item.title, "title", itemWhere, errors);
			checkText(item.text, "text", itemWhere, errors);
			checkIcon(item.icon, itemWhere, ctx, errors);
			if (item.href) checkHref(item.href, itemWhere, ctx, errors);
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
			const itemWhere = `${where}.items[${i}]`;
			if (!checkItem(item, itemWhere, errors)) return;
			checkText(item.title, "title", itemWhere, errors);
			checkText(item.text, "text", itemWhere, errors);
		});
	},
	stats(section, where, ctx, errors) {
		if (!Array.isArray(section.items) || !section.items.length) return errors.push(`${where}: items are required`);
		section.items.forEach((item, i) => {
			const itemWhere = `${where}.items[${i}]`;
			if (!checkItem(item, itemWhere, errors)) return;
			checkText(item.value, "value", itemWhere, errors);
			checkText(item.label, "label", itemWhere, errors);
		});
	},
	faq(section, where, ctx, errors) {
		checkText(section.heading, "heading", where, errors);
		if (!Array.isArray(section.items) || !section.items.length) return errors.push(`${where}: items are required`);
		section.items.forEach((item, i) => {
			const itemWhere = `${where}.items[${i}]`;
			if (!checkItem(item, itemWhere, errors)) return;
			checkText(item.question, "question", itemWhere, errors);
			checkHtml(item.answer, `${itemWhere}.answer`, ctx, errors);
		});
	},
	cta(section, where, ctx, errors) {
		checkText(section.heading, "heading", where, errors);
		checkText(section.text, "text", where, errors);
		checkText(section.primary?.label, "primary.label", where, errors);
		checkHref(section.primary?.href, `${where}.primary`, ctx, errors);
		checkSecondary(section.secondary, where, ctx, errors);
	},
	cardsLinks(section, where, ctx, errors) {
		checkText(section.heading, "heading", where, errors);
		if (!Array.isArray(section.items) || !section.items.length) return errors.push(`${where}: items are required`);
		section.items.forEach((item, i) => {
			const itemWhere = `${where}.items[${i}]`;
			if (!checkItem(item, itemWhere, errors)) return;
			checkText(item.title, "title", itemWhere, errors);
			checkText(item.text, "text", itemWhere, errors);
			checkHref(item.href, itemWhere, ctx, errors);
			if (item.image) checkImage(item.image, itemWhere, ctx, errors);
		});
	},
	marquee(section, where, ctx, errors) {
		if (!Array.isArray(section.items) || !section.items.length) return errors.push(`${where}: items are required`);
		section.items.forEach((item, i) => checkText(item, `items[${i}]`, where, errors, 60));
	},
};

// Allowed keys per section type, derived from each section component's own props (the
// spread of props onto that component is exactly `section` minus `type`, so any key here
// that the component doesn't destructure is silently dropped at render time -- e.g. an
// `intro` on a richText section would never appear on the page). `idPrefix` is injected by
// PageRenderer itself, not read from content, so it is deliberately not listed here.
const SECTION_FIELDS = {
	homeHero: ["eyebrow", "title", "highlight", "text", "primary", "secondary", "image", "badges"],
	richText: ["heading", "html"],
	features: ["eyebrow", "heading", "intro", "items", "variant", "numbered"],
	split: ["eyebrow", "heading", "html", "image", "imageAlt", "reverse"],
	steps: ["eyebrow", "heading", "intro", "items"],
	stats: ["eyebrow", "heading", "intro", "items"],
	faq: ["eyebrow", "heading", "items"],
	cta: ["heading", "text", "primary", "secondary"],
	cardsLinks: ["eyebrow", "heading", "intro", "items"],
	marquee: ["items"],
};

const ANCHOR_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const PAGE_FIELDS = ["path", "title", "description", "parent", "label", "hero", "sections"];

function checkUnknownKeys(obj, allowed, label, where, errors) {
	if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
	for (const key of Object.keys(obj)) {
		if (!allowed.includes(key)) errors.push(`${where}: ${key} is not a field of ${label}`);
	}
}

export function validatePage(page, ctx) {
	const errors = [];
	const where = page?.path || "(no path)";
	checkUnknownKeys(page, PAGE_FIELDS, "page", where, errors);
	if (typeof page?.path !== "string" || !page.path.startsWith("/")) errors.push(`${where}: path must start with /`);
	checkText(page?.title, "title", where, errors);
	checkText(page?.description, "description", where, errors, 160);
	if (page?.label !== undefined) checkText(page.label, "label", where, errors, 60);
	if (page?.parent && !ctx.knownRoutes.has(page.parent)) errors.push(`${where}: unknown parent ${page.parent}`);
	if (page?.hero) {
		checkText(page.hero.title, "hero.title", where, errors);
		checkText(page.hero.text, "hero.text", where, errors);
	}
	if (!Array.isArray(page?.sections) || !page.sections.length) {
		errors.push(`${where}: sections are required`);
		return errors;
	}
	const anchors = new Set();
	page.sections.forEach((section, i) => {
		const sectionWhere = `${where}: sections[${i}] (${section?.type})`;
		const check = SECTION_CHECKS[section?.type];
		if (!check) errors.push(`${sectionWhere}: unknown section type "${section?.type}"`);
		else check(section, sectionWhere, ctx, errors);
		// `anchor` (optional, any section type) becomes the section's id so
		// menu links like /about#our-team can jump to it.
		checkUnknownKeys(section, ["type", "anchor", ...(SECTION_FIELDS[section?.type] || [])], section?.type, sectionWhere, errors);
		if (section?.anchor !== undefined) {
			if (typeof section.anchor !== "string" || !ANCHOR_PATTERN.test(section.anchor)) {
				errors.push(`${sectionWhere}: anchor must be lowercase letters, numbers and hyphens`);
			} else if (anchors.has(section.anchor)) {
				errors.push(`${sectionWhere}: duplicate anchor "${section.anchor}"`);
			} else {
				anchors.add(section.anchor);
			}
		}
	});
	return errors;
}
