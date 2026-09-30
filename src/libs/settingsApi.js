const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
// The backend answers in milliseconds, but in `next dev` this fetch shares the
// event loop with on-demand compilation, which can stall it for several
// seconds; 2s produced false timeouts. A backend that is down fails fast
// (connection refused), so this only bounds a hung backend.
const SETTINGS_TIMEOUT_MS = 8000;

async function getSiteSettings() {
	try {
		const res = await fetch(`${BACKEND_URL}/api/settings`, {
			cache: "no-store",
			signal: AbortSignal.timeout(SETTINGS_TIMEOUT_MS),
		});
		if (!res.ok) throw new Error(`Backend responded with ${res.status}`);
		const data = await res.json();
		return data.settings || null;
	} catch (error) {
		// Handled: the site renders with its default colours. A warning, not an
		// error, so it doesn't raise the Next.js dev error overlay.
		console.warn("Falling back to default site colors:", error.message);
		return null;
	}
}

module.exports = { getSiteSettings };
