// Named, ready-made colour sets for the public website. Picking one fills the
// Site Colors form (nothing is saved until the admin presses Save). To add a
// preset, append an entry with all six colour fields.
const COLOR_PRESETS = [
	{
		id: "dpdp-midnight-indigo",
		name: "DPDP Midnight Indigo",
		description: "The redesigned home page look: deep indigo with a soft lavender background.",
		colors: {
			primaryColor: "#151655",
			secondaryColor: "#192538",
			hoverColor: "#12147b",
			textColor: "#404065",
			headingColor: "#18183a",
			backgroundColor: "#e4e3ee",
		},
	},
	{
		id: "dpdp-classic",
		name: "DPDP Classic",
		description: "The site's original colours: near-black navy with a cool sage background.",
		colors: {
			primaryColor: "#02092c",
			secondaryColor: "#0c1e21",
			hoverColor: "#02092c",
			textColor: "#364e52",
			headingColor: "#0c1e21",
			backgroundColor: "#d8e5e5",
		},
	},
	{
		id: "royal-blue",
		name: "Royal Blue",
		description: "Confident corporate blue that matches the logo, on a crisp pale-blue background.",
		colors: {
			primaryColor: "#1e3a8a",
			secondaryColor: "#0f172a",
			hoverColor: "#1d4ed8",
			textColor: "#334155",
			headingColor: "#0f172a",
			backgroundColor: "#e8eef9",
		},
	},
	{
		id: "slate-professional",
		name: "Slate Professional",
		description: "Understated charcoal and slate greys for a calm, formal look.",
		colors: {
			primaryColor: "#1e293b",
			secondaryColor: "#0f172a",
			hoverColor: "#334155",
			textColor: "#475569",
			headingColor: "#0f172a",
			backgroundColor: "#eef1f5",
		},
	},
	{
		id: "deep-ocean-teal",
		name: "Deep Ocean Teal",
		description: "Rich teal with a misty aqua background, fresh but still serious.",
		colors: {
			primaryColor: "#0f4c5c",
			secondaryColor: "#0b2a33",
			hoverColor: "#0e6377",
			textColor: "#3b5560",
			headingColor: "#0b2a33",
			backgroundColor: "#e3eff1",
		},
	},
	{
		id: "emerald-trust",
		name: "Emerald Trust",
		description: "Deep emerald greens that suggest security and trust, on a soft mint background.",
		colors: {
			primaryColor: "#065f46",
			secondaryColor: "#052e2b",
			hoverColor: "#047857",
			textColor: "#3f5a52",
			headingColor: "#052e2b",
			backgroundColor: "#e6f2ed",
		},
	},
	{
		id: "royal-purple",
		name: "Royal Purple",
		description: "Premium deep purple with a light lilac background.",
		colors: {
			primaryColor: "#3b0764",
			secondaryColor: "#1e1b3a",
			hoverColor: "#581c87",
			textColor: "#4a4063",
			headingColor: "#1e1b3a",
			backgroundColor: "#efe9f6",
		},
	},
];

export const PRESET_COLOR_KEYS = ["primaryColor", "secondaryColor", "hoverColor", "textColor", "headingColor", "backgroundColor"];

// True when every colour in `values` matches the preset (case-insensitive).
export function matchesPreset(values, preset) {
	if (!values) return false;
	return PRESET_COLOR_KEYS.every(key => String(values[key] || "").toLowerCase() === preset.colors[key].toLowerCase());
}

export default COLOR_PRESETS;
