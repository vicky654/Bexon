export const CONTENT_TABS = [
	{ value: "news", label: "News", singular: "News item" },
	{ value: "event", label: "Events", singular: "Event" },
	{ value: "resource", label: "Resources", singular: "Resource" },
];
export const EVENT_FORMATS = [
	{ value: "online", label: "Online" },
	{ value: "in_person", label: "In person" },
];
export const RESOURCE_TYPES = [
	{ value: "whitepaper", label: "Whitepaper" },
	{ value: "guide", label: "Guide" },
	{ value: "checklist", label: "Checklist" },
	{ value: "report", label: "Report" },
];
export function kindConfig(kind) {
	return CONTENT_TABS.find(tab => tab.value === kind) || CONTENT_TABS[0];
}
// "2026-10-05T04:30:00.000Z" -> "2026-10-05T10:00" in the admin's local time, and back.
export function toLocalInput(value) {
	if (!value) return "";
	const date = new Date(value);
	return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function fromLocalInput(value) {
	return value ? new Date(value).toISOString() : "";
}
