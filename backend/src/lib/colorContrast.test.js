const test = require("node:test");
const assert = require("node:assert/strict");
const { contrastRatio, checkPalette, PALETTE_KEYS } = require("./colorContrast");

const DEFAULT_PALETTE = {
	primaryColor: "#02092c",
	secondaryColor: "#0c1e21",
	hoverColor: "#02092c",
	textColor: "#364e52",
	headingColor: "#0c1e21",
	backgroundColor: "#d8e5e5",
};

test("contrastRatio matches WCAG for black on white", () => {
	assert.equal(Math.round(contrastRatio("#000000", "#ffffff")), 21);
	assert.equal(contrastRatio("#777777", "#777777"), 1);
});

test("the site's default palette is readable", () => {
	assert.deepEqual(checkPalette(DEFAULT_PALETTE), { ok: true, problems: [] });
});

test("flags light text on a light background", () => {
	const result = checkPalette({ ...DEFAULT_PALETTE, textColor: "#cccccc", backgroundColor: "#ffffff" });
	assert.equal(result.ok, false);
	assert.ok(result.problems.some(p => p.includes("textColor")));
});

test("flags a primary color too light for white button text", () => {
	const result = checkPalette({ ...DEFAULT_PALETTE, primaryColor: "#ffd966" });
	assert.equal(result.ok, false);
	assert.ok(result.problems.some(p => p.includes("primaryColor")));
});

test("rejects missing or malformed colors", () => {
	const missing = { ...DEFAULT_PALETTE };
	delete missing.hoverColor;
	assert.equal(checkPalette(missing).ok, false);
	assert.equal(checkPalette({ ...DEFAULT_PALETTE, headingColor: "red" }).ok, false);
	assert.equal(checkPalette(null).ok, false);
	assert.equal(PALETTE_KEYS.length, 6);
});
