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
