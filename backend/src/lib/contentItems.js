const { RESOURCE_KEY_PATTERN } = require("./resourceFiles");

const KINDS = ["news", "event", "resource"];
const EVENT_FORMATS = { online: "Online", in_person: "In person" };
const RESOURCE_TYPES = { whitepaper: "Whitepaper", guide: "Guide", checklist: "Checklist", report: "Report" };
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const KIND_FIELDS = {
	news: ["sourceUrl"],
	event: ["startsAt", "endsAt", "format", "venue", "recordingUrl"],
	resource: ["resourceType", "fileKey", "gated"],
};
const ALL_KIND_FIELDS = [...new Set(Object.values(KIND_FIELDS).flat())];

function isKind(kind) {
	return typeof kind === "string" && KINDS.includes(kind);
}

function text(value) {
	return typeof value === "string" ? value.trim() : "";
}

function isUrl(value, protocols) {
	try {
		return protocols.includes(new URL(value).protocol);
	} catch {
		return false;
	}
}

// undefined = not given, null = invalid, Date = valid
function parseDate(value) {
	const raw = text(value);
	if (!raw) return undefined;
	const date = new Date(raw);
	return Number.isNaN(date.getTime()) ? null : date;
}

function validateContent(kind, raw) {
	if (!isKind(kind)) return "Unknown content type.";
	const title = text(raw.title);
	const slug = text(raw.slug);
	const summary = text(raw.summary);
	const coverImage = text(raw.coverImage);

	if (!title) return "Please enter a title.";
	if (title.length > 200) return "Please keep the title under 200 characters.";
	if (!SLUG_PATTERN.test(slug) || slug.length > 120) {
		return "The slug may only use lowercase letters, numbers and single hyphens (max 120).";
	}
	if (!summary) return "Please enter a summary.";
	if (summary.length > 300) return "Please keep the summary under 300 characters.";
	if (coverImage && !coverImage.startsWith("/uploads/") && !isUrl(coverImage, ["https:", "http:"])) {
		return "The cover image must be an uploaded image or a web address.";
	}
	if (parseDate(raw.publishedAt) === null) return "Please provide a valid publish date.";

	if (kind === "news") {
		if (text(raw.sourceUrl) && !isUrl(text(raw.sourceUrl), ["https:"])) return "The source link must start with https://.";
	}

	if (kind === "event") {
		const startsAt = parseDate(raw.startsAt);
		const endsAt = parseDate(raw.endsAt);
		if (!startsAt) return "Please set the event start time.";
		if (endsAt === null) return "Please provide a valid end time.";
		if (endsAt && endsAt < startsAt) return "The event can't end before it starts.";
		if (!Object.hasOwn(EVENT_FORMATS, text(raw.format))) return "Please choose the event format.";
		if (text(raw.venue).length > 300) return "Please keep the venue under 300 characters.";
		if (text(raw.recordingUrl) && !isUrl(text(raw.recordingUrl), ["https:"])) {
			return "The recording link must start with https://.";
		}
	}

	if (kind === "resource") {
		const fileKey = text(raw.fileKey);
		if (!Object.hasOwn(RESOURCE_TYPES, text(raw.resourceType))) return "Please choose the resource type.";
		if (fileKey && !RESOURCE_KEY_PATTERN.test(fileKey)) return "Invalid file reference.";
		if (raw.published === true && !fileKey) return "Upload the PDF before publishing this resource.";
	}

	return null;
}

function normalizeContent(kind, raw) {
	const data = {
		kind,
		title: text(raw.title),
		slug: text(raw.slug),
		summary: text(raw.summary),
		body: typeof raw.body === "string" ? raw.body : "",
		coverImage: text(raw.coverImage) || null,
		published: raw.published === true,
		publishedAt: parseDate(raw.publishedAt) || new Date(),
		sourceUrl: text(raw.sourceUrl) || null,
		startsAt: parseDate(raw.startsAt) || null,
		endsAt: parseDate(raw.endsAt) || null,
		format: text(raw.format) || null,
		venue: text(raw.venue) || null,
		recordingUrl: text(raw.recordingUrl) || null,
		resourceType: text(raw.resourceType) || null,
		fileKey: text(raw.fileKey) || null,
		gated: raw.gated !== false,
	};
	for (const field of ALL_KIND_FIELDS) {
		if (!KIND_FIELDS[kind].includes(field)) data[field] = field === "gated" ? false : null;
	}
	return data;
}

function serializePublic(item) {
	const { fileKey, ...rest } = item;
	return item.kind === "resource" ? { ...rest, hasFile: Boolean(fileKey) } : rest;
}

module.exports = { KINDS, EVENT_FORMATS, RESOURCE_TYPES, isKind, validateContent, normalizeContent, serializePublic };
