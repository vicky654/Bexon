const { CONTACT_TOPICS } = require("./contactHelpers");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\d{10}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const PARTNERSHIP_TYPES = {
	reseller: "Reseller / Referral",
	technology: "Technology Integration",
	consulting: "Consulting / Implementation",
	other: "Other",
};

// Department names are the ones the old site sent, so the consent portal
// already has consent templates for them.
const LEAD_TYPES = {
	contact: {
		label: "Contact",
		department: "Contact Us",
		fields: ["name", "email", "phone", "topic", "message"],
		required: ["name", "email", "phone", "topic", "message"],
	},
	consultation: {
		label: "Consultation",
		department: "Sales Enquiry",
		fields: ["name", "email", "phone", "company", "topic", "preferredAt", "message"],
		required: ["name", "email", "phone", "company", "topic"],
	},
	partner: {
		label: "Partner",
		department: "Contact Us",
		fields: ["name", "email", "phone", "company", "partnershipType", "message"],
		required: ["name", "email", "phone", "company", "partnershipType", "message"],
	},
	newsletter: {
		label: "Newsletter",
		department: "Newsletters",
		fields: ["name", "email", "phone"],
		required: ["name", "email", "phone"],
	},
};

const OPTIONAL_FIELDS = ["company", "topic", "partnershipType", "preferredAt", "message"];

function isLeadType(type) {
	return typeof type === "string" && Object.prototype.hasOwnProperty.call(LEAD_TYPES, type);
}

function oneMonthAfter(date) {
	const originalDay = date.getUTCDate();
	const result = new Date(date);

	// Move to the 1st of the target month (1 month later)
	result.setUTCDate(1);
	result.setUTCMonth(result.getUTCMonth() + 1);

	// Get days in the target month by checking the last day of that month
	const year = result.getUTCFullYear();
	const month = result.getUTCMonth();
	const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

	// Clamp the original day to the last day of the target month
	const clampedDay = Math.min(originalDay, daysInMonth);
	result.setUTCDate(clampedDay);

	return result;
}

function validateLead(type, lead, now = new Date()) {
	if (!isLeadType(type)) return "Unknown form type.";
	const { fields, required } = LEAD_TYPES[type];
	const needs = field => required.includes(field);
	const uses = field => fields.includes(field);

	if (!lead.name) return "Please enter your name.";
	if (lead.name.length > 100) return "Please keep your name under 100 characters.";
	if (!emailPattern.test(lead.email || "") || lead.email.length > 254) return "Please provide a valid email address.";
	if (!phonePattern.test(lead.phone || "")) return "Please provide a 10-digit phone number.";

	if (uses("company")) {
		if (needs("company") && !lead.company) return "Please enter your company name.";
		if ((lead.company || "").length > 150) return "Please keep the company name under 150 characters.";
	}
	if (uses("topic") && (needs("topic") || lead.topic) && !Object.hasOwn(CONTACT_TOPICS, lead.topic)) {
		return "Please choose the purpose of reaching out.";
	}
	if (
		uses("partnershipType") &&
		(needs("partnershipType") || lead.partnershipType) &&
		!Object.hasOwn(PARTNERSHIP_TYPES, lead.partnershipType)
	) {
		return "Please choose a partnership type.";
	}
	if (uses("preferredAt") && lead.preferredAt) {
		const at = new Date(lead.preferredAt);
		const earliest = new Date(now.getTime() + DAY_MS);
		if (Number.isNaN(at.getTime()) || at < earliest || at > oneMonthAfter(now)) {
			return "Please choose a time at least 24 hours from now and within one month.";
		}
	}
	if (uses("message")) {
		if (needs("message") && !lead.message) return "Please enter a message.";
		if ((lead.message || "").length > 5000) return "Please keep your message under 5000 characters.";
	}
	return null;
}

function normalizeLead(type, lead) {
	const { fields } = LEAD_TYPES[type];
	const result = { ...lead };
	for (const field of OPTIONAL_FIELDS) {
		if (!fields.includes(field)) result[field] = "";
	}
	result.preferredAt = result.preferredAt ? new Date(result.preferredAt) : null;
	return result;
}

module.exports = { LEAD_TYPES, PARTNERSHIP_TYPES, isLeadType, validateLead, normalizeLead };
