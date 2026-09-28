const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const MIN_CONTRAST = 4.5;
const WHITE = "#ffffff";

const PALETTE_KEYS = [
	"primaryColor",
	"secondaryColor",
	"hoverColor",
	"textColor",
	"headingColor",
	"backgroundColor",
];

function relativeLuminance(hex) {
	const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
	const [r, g, b] = channels.map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// WCAG 2 contrast ratio, from 1 (identical) to 21 (black on white).
function contrastRatio(a, b) {
	const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
	return (light + 0.05) / (dark + 0.05);
}

// Pairs the site actually renders together: body text and headings on the
// light background, and white text on buttons, hover states and dark sections.
const READABLE_PAIRS = [
	["textColor", "backgroundColor"],
	["headingColor", "backgroundColor"],
	["primaryColor", WHITE],
	["hoverColor", WHITE],
	["secondaryColor", WHITE],
];

function checkPalette(palette) {
	if (!palette || typeof palette !== "object") {
		return { ok: false, problems: ["No palette was returned."] };
	}

	const problems = [];
	for (const key of PALETTE_KEYS) {
		if (typeof palette[key] !== "string" || !HEX_PATTERN.test(palette[key])) {
			problems.push(`${key} must be a #rrggbb hex color.`);
		}
	}
	if (problems.length) return { ok: false, problems };

	for (const [foreground, background] of READABLE_PAIRS) {
		const backgroundHex = background === WHITE ? WHITE : palette[background];
		const ratio = contrastRatio(palette[foreground], backgroundHex);
		if (ratio < MIN_CONTRAST) {
			const against = background === WHITE ? "white text" : background;
			problems.push(`${foreground} against ${against} has contrast ${ratio.toFixed(2)}, needs at least ${MIN_CONTRAST}.`);
		}
	}

	return { ok: problems.length === 0, problems };
}

module.exports = { PALETTE_KEYS, contrastRatio, checkPalette };
