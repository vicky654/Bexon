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

export function isLeadFormType(type) {
	return typeof type === "string" && Object.prototype.hasOwnProperty.call(LEAD_FORMS, type);
}

export function leadForm(type) {
	return LEAD_FORMS[isLeadFormType(type) ? type : "contact"];
}
