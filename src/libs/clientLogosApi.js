const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
// Same reasoning as settingsApi.js: cached for a minute so pages stay
// prerendered; a logo added in the admin shows within a minute.
const REVALIDATE_SECONDS = 60;
const TIMEOUT_MS = 8000;

// The admin stores logo URLs like "http://localhost:4000/images/client-logo/x.svg".
// For this site's own images keep only the path, so they work on any domain.
function toSitePath(url) {
	try {
		const parsed = new URL(url);
		if (["localhost", "127.0.0.1"].includes(parsed.hostname)) return parsed.pathname;
		return parsed.protocol === "https:" ? url : null;
	} catch {
		return typeof url === "string" && url.startsWith("/") ? url : null;
	}
}

// Client logos managed under Admin -> Logos, as [{ name, image }].
// Returns [] when the backend is unavailable, so the section is hidden.
async function getClientLogos() {
	try {
		const res = await fetch(`${BACKEND_URL}/api/brand-logos`, {
			next: { revalidate: REVALIDATE_SECONDS },
			signal: AbortSignal.timeout(TIMEOUT_MS),
		});
		if (!res.ok) throw new Error(`Backend responded with ${res.status}`);
		const data = await res.json();
		return (data.logos || [])
			.map(logo => ({ name: logo.alt || "Client", image: toSitePath(logo.imageUrl) }))
			.filter(logo => logo.image);
	} catch (error) {
		console.warn("Client logos unavailable:", error.message);
		return [];
	}
}

module.exports = { getClientLogos, toSitePath };
