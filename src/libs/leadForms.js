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
};

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
