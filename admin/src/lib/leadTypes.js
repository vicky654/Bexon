export const LEAD_TYPE_TABS = [
	{ value: "all", label: "All" },
	{ value: "contact", label: "Contact" },
	{ value: "consultation", label: "Consultation" },
	{ value: "partner", label: "Partner" },
	{ value: "newsletter", label: "Newsletter" },
];

export const PARTNERSHIP_LABELS = {
	reseller: "Reseller / Referral",
	technology: "Technology Integration",
	consulting: "Consulting / Implementation",
	other: "Other",
};

export function leadTypeLabel(type) {
	return LEAD_TYPE_TABS.find(tab => tab.value === type)?.label || "Contact";
}
