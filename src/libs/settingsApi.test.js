const test = require("node:test");
const assert = require("node:assert/strict");

test("getSiteSettings returns null when the backend is unreachable", async () => {
	const originalFetch = global.fetch;
	global.fetch = async () => {
		throw new Error("network error");
	};

	try {
		const { getSiteSettings } = require("./settingsApi");
		const settings = await getSiteSettings();
		assert.equal(settings, null);
	} finally {
		global.fetch = originalFetch;
	}
});

test("getSiteSettings returns null when the backend responds with an error status", async () => {
	const originalFetch = global.fetch;
	global.fetch = async () => ({ ok: false, status: 500 });

	try {
		const { getSiteSettings } = require("./settingsApi");
		const settings = await getSiteSettings();
		assert.equal(settings, null);
	} finally {
		global.fetch = originalFetch;
	}
});

test("getSiteSettings returns the settings object on success", async () => {
	const originalFetch = global.fetch;
	global.fetch = async () => ({
		ok: true,
		json: async () => ({ settings: { primaryColor: "#123456" } }),
	});

	try {
		const { getSiteSettings } = require("./settingsApi");
		const settings = await getSiteSettings();
		assert.equal(settings.primaryColor, "#123456");
	} finally {
		global.fetch = originalFetch;
	}
});
