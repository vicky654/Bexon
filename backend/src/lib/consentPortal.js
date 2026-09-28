const jwt = require("jsonwebtoken");

const NOTICE_TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15 * 1000;
const noticeCache = new Map();

function isConfigured() {
	return Boolean(process.env.CONSENT_API_BASE && process.env.CONSENT_JWT_SECRET);
}

function baseUrl() {
	return process.env.CONSENT_API_BASE.replace(/\/+$/, "");
}

// Same claims the old PHP site signed with Firebase JWT: no iat, and a
// custom "expiry" claim rather than the standard "exp".
function buildToken() {
	return jwt.sign(
		{
			iss: process.env.CONSENT_JWT_ISS,
			aud: process.env.CONSENT_JWT_AUD,
			email: process.env.CONSENT_JWT_EMAIL,
			expiry: Math.floor(Date.now() / 1000) + 3600,
		},
		process.env.CONSENT_JWT_SECRET,
		{ algorithm: "HS256", noTimestamp: true }
	);
}

async function readJson(res, label) {
	const text = await res.text();
	let body = null;
	try {
		body = JSON.parse(text);
	} catch {
		body = null;
	}
	if (!res.ok || body === null || typeof body !== "object") {
		throw new Error(`Consent portal ${label} failed with status ${res.status}`);
	}
	return body;
}

async function getConsentNotices(department) {
	const cached = noticeCache.get(department);
	if (cached && Date.now() - cached.at < NOTICE_TTL_MS) return cached.notices;

	const query = new URLSearchParams({ department_name: department });
	const res = await fetch(`${baseUrl()}/api/v2/get/template_details?${query}`, {
		headers: { Authorization: `Bearer ${buildToken()}` },
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	});
	const body = await readJson(res, "template_details");

	if (body.status !== "Success" || !body.data || typeof body.data !== "object") {
		throw new Error("Consent portal returned no consent notices");
	}

	const notices = {};
	for (const [language, value] of Object.entries(body.data)) {
		if (value && typeof value.content === "string") notices[language] = value.content;
	}

	noticeCache.set(department, { at: Date.now(), notices });
	return notices;
}

// Called twice per lead: without otp the portal emails the visitor a code
// and returns it as `otp`; with otp it records the visitor's consent.
async function createConsent({ name, email, phone, ipaddress, department, devicetype, language, otp }) {
	const form = new URLSearchParams({
		name,
		email,
		phone,
		ipaddress: ipaddress || "",
		department,
		devicetype: devicetype || "",
		digi_type: "parent",
		digi_id: "",
		digi_locker_id: "",
		digi_name: "",
		digi_gender: "",
		digi_dob: "",
		digi_email: "",
		digi_mobile: "",
		digi_eaadhaar: "",
	});
	if (language) form.set("language", language);
	if (otp) form.set("otp", otp);

	const res = await fetch(`${baseUrl()}/api/v2/create_consent`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${buildToken()}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: form,
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	});
	return readJson(res, "create_consent");
}

function _clearNoticeCache() {
	noticeCache.clear();
}

module.exports = { isConfigured, buildToken, getConsentNotices, createConsent, _clearNoticeCache };
