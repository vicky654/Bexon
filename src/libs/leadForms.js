// Mirrors backend/src/lib/leadTypes.js (fields and required lists).
export const PARTNERSHIP_OPTIONS = [
	{ value: "", optionName: "Partnership type *" },
	{ value: "reseller", optionName: "Reseller / Referral" },
	{ value: "technology", optionName: "Technology Integration" },
	{ value: "consulting", optionName: "Consulting / Implementation" },
	{ value: "other", optionName: "Other" },
];

export const LEAD_FORMS = {
	contact: {
		fields: ["name", "email", "phone", "topic", "message"],
		required: ["name", "email", "phone", "topic", "message"],
		submitText: "Submit Now",
		thankYou: "Thank you for contacting DPDP Consultants; Our Privacy Expert will reach out to you shortly.",
	},
	consultation: {
		fields: ["name", "email", "phone", "company", "topic", "preferredAt", "message"],
		required: ["name", "email", "phone", "company", "topic"],
		submitText: "Book Consultation",
		thankYou: "Thank you for booking a consultation. Our team will confirm your slot shortly.",
	},
	partner: {
		fields: ["name", "email", "phone", "company", "partnershipType", "message"],
		required: ["name", "email", "phone", "company", "partnershipType", "message"],
		submitText: "Send Enquiry",
		thankYou:
			"Thank you for your interest in partnering with DPDP Consultants. Our partnerships team will get in touch.",
	},
	newsletter: {
		fields: ["name", "email", "phone"],
		required: ["name", "email", "phone"],
		submitText: "Subscribe",
		thankYou: "You're subscribed. Welcome to the DPDP Consultants newsletter.",
	},
	webinar: {
		fields: ["name", "email", "phone", "company"],
		required: ["name", "email", "phone", "company"],
		submitText: "Register Now",
		thankYou: "You're registered. We'll email you the joining details before the event.",
	},
	resource: {
		fields: ["name", "email", "phone", "company"],
		required: ["name", "email", "phone", "company"],
		submitText: "Get the Resource",
		thankYou: "Thank you. Your download should start automatically.",
	},
};

// Session-storage key used to hand the one-time resource download URL off to
// the thank-you page without ever putting it in a page URL (query strings get
// logged by analytics/ad tools).
export const DOWNLOAD_URL_KEY = "dpdp-download-url";

// The backend hands back a download URL that we store in sessionStorage and
// later drop into an <a href>. Guard against a compromised/odd backend
// response (or tampered sessionStorage) turning that into an open redirect or
// a javascript:/data: URL by only ever trusting our own relative download
// proxy path.
const SAFE_DOWNLOAD_URL_PATTERN = /^\/api\/content\/resource\/[a-z0-9-]+\/download(\?token=[A-Za-z0-9._-]+)?$/;

export function isSafeDownloadUrl(url) {
	return typeof url === "string" && SAFE_DOWNLOAD_URL_PATTERN.test(url);
}

// Decodes (without verifying) the `exp` claim of the JWT in a download URL's
// `token` query param, purely so the UI can show/hide "Download again" and
// warn before the link actually expires server-side. Never trust this for
// anything security-sensitive; the backend re-verifies the token itself.
export function downloadUrlExpiry(url) {
	try {
		const token = new URL(url, "http://localhost").searchParams.get("token");
		if (!token) return null;
		const payload = token.split(".")[1];
		if (!payload) return null;
		const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
		const { exp } = JSON.parse(atob(base64));
		return typeof exp === "number" ? exp * 1000 : null;
	} catch {
		return null;
	}
}

// Mirrors backend/src/lib/leadTypes.js's oneMonthAfter: a calendar month
// later, with the day clamped to that month's last day (e.g. Jan 31 -> Feb 28).
export function oneMonthAfterUtc(date) {
	const originalDay = date.getUTCDate();
	const result = new Date(date);

	result.setUTCDate(1);
	result.setUTCMonth(result.getUTCMonth() + 1);

	const year = result.getUTCFullYear();
	const month = result.getUTCMonth();
	const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

	result.setUTCDate(Math.min(originalDay, daysInMonth));
	return result;
}

export function isLeadFormType(type) {
	return typeof type === "string" && Object.prototype.hasOwnProperty.call(LEAD_FORMS, type);
}

export function leadForm(type) {
	return LEAD_FORMS[isLeadFormType(type) ? type : "contact"];
}
