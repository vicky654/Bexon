const test = require("node:test");
const assert = require("node:assert/strict");
const { LEAD_TYPES, PARTNERSHIP_TYPES, isLeadType, validateLead, normalizeLead } = require("./leadTypes");

const NOW = new Date("2026-10-01T10:00:00.000Z");
const base = {
	name: "Jane Doe",
	email: "jane@example.com",
	phone: "9876543210",
	company: "Acme",
	topic: "dpo_service",
	partnershipType: "reseller",
	preferredAt: "",
	message: "Hello",
};

test("departments match the old site", () => {
	assert.equal(LEAD_TYPES.contact.department, "Contact Us");
	assert.equal(LEAD_TYPES.consultation.department, "Sales Enquiry");
	assert.equal(LEAD_TYPES.partner.department, "Contact Us");
	assert.equal(LEAD_TYPES.newsletter.department, "Newsletters");
	assert.equal(Object.keys(PARTNERSHIP_TYPES).length, 4);
});

test("isLeadType accepts only known types", () => {
	assert.equal(isLeadType("partner"), true);
	assert.equal(isLeadType("toString"), false);
	assert.equal(isLeadType(""), false);
});

test("unknown type is rejected", () => {
	assert.equal(validateLead("poem", base, NOW), "Unknown form type.");
});

test("each type accepts a complete lead", () => {
	for (const type of Object.keys(LEAD_TYPES)) {
		assert.equal(validateLead(type, base, NOW), null, type);
	}
});

test("newsletter needs only name, email and phone", () => {
	assert.equal(validateLead("newsletter", { name: "A", email: "a@b.co", phone: "9876543210" }, NOW), null);
	assert.ok(validateLead("newsletter", { name: "A", email: "a@b.co", phone: "" }, NOW));
});

test("consultation requires company and topic; message and time optional", () => {
	assert.ok(validateLead("consultation", { ...base, company: "" }, NOW));
	assert.ok(validateLead("consultation", { ...base, topic: "" }, NOW));
	assert.equal(validateLead("consultation", { ...base, message: "", preferredAt: "" }, NOW), null);
});

test("partner requires a known partnership type and a message", () => {
	assert.equal(validateLead("partner", { ...base, partnershipType: "" }, NOW), "Please choose a partnership type.");
	assert.equal(validateLead("partner", { ...base, partnershipType: "franchise" }, NOW), "Please choose a partnership type.");
	assert.ok(validateLead("partner", { ...base, message: "" }, NOW));
});

test("company is capped at 150 characters", () => {
	assert.ok(validateLead("partner", { ...base, company: "x".repeat(151) }, NOW));
	assert.equal(validateLead("partner", { ...base, company: "x".repeat(150) }, NOW), null);
});

test("preferredAt must be between tomorrow and one month from now", () => {
	const message = "Please choose a time at least 24 hours from now and within one month.";
	const at = iso => validateLead("consultation", { ...base, preferredAt: iso }, NOW);
	assert.equal(at("2026-10-01T12:00:00.000Z"), message); // today
	assert.equal(at("2026-10-02T10:00:00.000Z"), null); // exactly +1 day
	assert.equal(at("2026-11-01T10:00:00.000Z"), null); // exactly +1 month
	assert.equal(at("2026-11-02T10:00:00.000Z"), message); // past +1 month
	assert.equal(at("not a date"), message);
});

test("preferredAt handles month-end dates correctly (Jan 31)", () => {
	const message = "Please choose a time at least 24 hours from now and within one month.";
	const nowJan31 = new Date("2026-01-31T10:00:00.000Z");
	const at = iso => validateLead("consultation", { ...base, preferredAt: iso }, nowJan31);

	// One month from Jan 31 is Feb 28 (not Mar 1)
	assert.equal(at("2026-02-28T10:00:00.000Z"), null);
	assert.equal(at("2026-03-01T10:00:00.000Z"), message);
});

test("preferredAt handles leap year month-end dates correctly (Jan 31 leap year)", () => {
	const nowJan31Leap = new Date("2028-01-31T10:00:00.000Z");
	const at = iso => validateLead("consultation", { ...base, preferredAt: iso }, nowJan31Leap);

	// One month from Jan 31 in leap year is Feb 29 (not Feb 28)
	assert.equal(at("2028-02-29T10:00:00.000Z"), null);
});

test("shared limits still apply", () => {
	assert.ok(validateLead("contact", { ...base, name: "x".repeat(101) }, NOW));
	assert.ok(validateLead("contact", { ...base, email: "nope" }, NOW));
	assert.ok(validateLead("contact", { ...base, phone: "12345" }, NOW));
	assert.ok(validateLead("contact", { ...base, topic: "business_strategy" }, NOW));
	assert.ok(validateLead("contact", { ...base, message: "x".repeat(5001) }, NOW));
});

test("normalizeLead drops fields the type doesn't use and parses the time", () => {
	const contact = normalizeLead("contact", base);
	assert.equal(contact.company, "");
	assert.equal(contact.partnershipType, "");
	assert.equal(contact.preferredAt, null);
	assert.equal(contact.topic, "dpo_service");

	const consult = normalizeLead("consultation", { ...base, preferredAt: "2026-10-05T09:30:00.000Z" });
	assert.ok(consult.preferredAt instanceof Date);
	assert.equal(consult.partnershipType, "");
	assert.equal(consult.company, "Acme");
});
