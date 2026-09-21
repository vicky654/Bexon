const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

async function getSiteSettings() {
	try {
		const res = await fetch(`${BACKEND_URL}/api/settings`, {
			cache: "no-store",
			signal: AbortSignal.timeout(2000),
		});
		if (!res.ok) throw new Error(`Backend responded with ${res.status}`);
		const data = await res.json();
		return data.settings || null;
	} catch (error) {
		console.error("Falling back to default site colors:", error.message);
		return null;
	}
}

module.exports = { getSiteSettings };
