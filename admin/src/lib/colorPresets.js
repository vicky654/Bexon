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
];

export const PRESET_COLOR_KEYS = ["primaryColor", "secondaryColor", "hoverColor", "textColor", "headingColor", "backgroundColor"];

// True when every colour in `values` matches the preset (case-insensitive).
export function matchesPreset(values, preset) {
	if (!values) return false;
	return PRESET_COLOR_KEYS.every(key => String(values[key] || "").toLowerCase() === preset.colors[key].toLowerCase());
}

export default COLOR_PRESETS;
