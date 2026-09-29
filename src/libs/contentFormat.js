const TZ = "Asia/Kolkata";

export const EVENT_FORMAT_LABELS = { online: "Online", in_person: "In person" };
export const RESOURCE_TYPE_FILTERS = [
	{ value: "", label: "All" },
	{ value: "whitepaper", label: "Whitepapers" },
	{ value: "guide", label: "Guides" },
	{ value: "checklist", label: "Checklists" },
	{ value: "report", label: "Reports" },
];
export const RESOURCE_TYPE_LABELS = { whitepaper: "Whitepaper", guide: "Guide", checklist: "Checklist", report: "Report" };

export function formatDate(value) {
	return value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: TZ }) : "";
}

export function formatDateTime(value) {
	if (!value) return "";
	const text = new Date(value).toLocaleString("en-IN", {
		day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ,
	});
	return `${text} IST`;
}

export function eventState(item, now = new Date()) {
	const startsAt = new Date(item.startsAt);
	if (startsAt > now) return "upcoming";
	const endsAt = item.endsAt ? new Date(item.endsAt) : startsAt;
	return endsAt >= now ? "live" : "ended";
}

export function pageFrom(value) {
	const page = Number.parseInt(value, 10);
	return Number.isInteger(page) && page > 0 ? page : 1;
}
