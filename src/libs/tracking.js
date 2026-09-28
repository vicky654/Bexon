const TRACKING_KEY = "dpdp-contact-tracking";
const SUBMITTED_KEY = "dpdp-contact-submitted";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_id"];

export const GOOGLE_ADS_ID = "AW-16540124026";
export const GOOGLE_ADS_CONVERSION = "AW-16540124026/XOSvCLjTsasZEPqG-c49";

// Remembers how the visitor first arrived this session (UTM params and the
// external referrer). Storage can be unavailable; tracking is best-effort.
export function captureTracking() {
	try {
		if (sessionStorage.getItem(TRACKING_KEY)) return;
		const params = new URLSearchParams(window.location.search);
		const utm = UTM_KEYS.filter(key => params.get(key))
			.map(key => `${key}=${params.get(key)}`)
			.join("&");
		const referrer =
			document.referrer && !document.referrer.startsWith(window.location.origin)
				? document.referrer
				: "";
		sessionStorage.setItem(TRACKING_KEY, JSON.stringify({ utm, referrer }));
	} catch {}
}

export function readTracking() {
	try {
		return JSON.parse(sessionStorage.getItem(TRACKING_KEY)) || {};
	} catch {
		return {};
	}
}

export function markContactSubmitted() {
	try {
		sessionStorage.setItem(SUBMITTED_KEY, "1");
	} catch {}
}

// True once per real submission, so reloading /thank-you or visiting it
// directly doesn't count as another Google Ads conversion.
export function consumeContactSubmitted() {
	try {
		const submitted = sessionStorage.getItem(SUBMITTED_KEY) === "1";
		sessionStorage.removeItem(SUBMITTED_KEY);
		return submitted;
	} catch {
		return false;
	}
}
