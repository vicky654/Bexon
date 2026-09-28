// Mirrors backend/src/lib/colorContrast.js so random palettes pass the same
// readability rules the AI suggestions are held to.
const MIN_CONTRAST = 4.5;
const WHITE = "#ffffff";
const MAX_ATTEMPTS = 50;

function relativeLuminance(hex) {
	const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
	const [r, g, b] = channels.map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
	const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
	return (light + 0.05) / (dark + 0.05);
}

function isReadable(palette) {
	return (
		contrastRatio(palette.textColor, palette.backgroundColor) >= MIN_CONTRAST &&
		contrastRatio(palette.headingColor, palette.backgroundColor) >= MIN_CONTRAST &&
		contrastRatio(palette.primaryColor, WHITE) >= MIN_CONTRAST &&
		contrastRatio(palette.hoverColor, WHITE) >= MIN_CONTRAST &&
		contrastRatio(palette.secondaryColor, WHITE) >= MIN_CONTRAST
	);
}

function hslToHex(h, s, l) {
	const hue = ((h % 360) + 360) % 360;
	const sat = s / 100;
	const light = l / 100;
	const a = sat * Math.min(light, 1 - light);
	const channel = n => {
		const k = (n + hue / 30) % 12;
		const value = light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
		return Math.round(value * 255)
			.toString(16)
			.padStart(2, "0");
	};
	return `#${channel(0)}${channel(8)}${channel(4)}`;
}

function between(min, max) {
	return min + Math.random() * (max - min);
}

// Builds every color around one random base hue so the set looks related:
// deep, saturated brand colors; dark, low-saturation text; a pale tinted background.
function buildCandidate() {
	const hue = between(0, 360);
	const primaryLightness = between(18, 32);
	return {
		primaryColor: hslToHex(hue, between(55, 85), primaryLightness),
		secondaryColor: hslToHex(hue + between(-25, 25), between(35, 60), between(8, 16)),
		hoverColor: hslToHex(hue, between(55, 85), Math.min(primaryLightness + between(6, 10), 36)),
		textColor: hslToHex(hue, between(10, 25), between(22, 34)),
		headingColor: hslToHex(hue, between(25, 45), between(8, 16)),
		backgroundColor: hslToHex(hue + between(-15, 15), between(20, 45), between(91, 96)),
	};
}

export default function randomPalette() {
	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
		const candidate = buildCandidate();
		if (isReadable(candidate)) return candidate;
	}
	// Practically unreachable with these ranges; fall back to a known-good set.
	return {
		primaryColor: "#02092c",
		secondaryColor: "#0c1e21",
		hoverColor: "#02092c",
		textColor: "#364e52",
		headingColor: "#0c1e21",
		backgroundColor: "#d8e5e5",
	};
}
