const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

async function apiFetch(path, options = {}) {
	const res = await fetch(`${BACKEND_URL}${path}`, {
		...options,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...(options.headers || {}),
		},
	});

	const data = await res.json().catch(() => ({}));

	if (!res.ok) {
		throw new Error(data.message || `Request failed with status ${res.status}`);
	}

	return data;
}

export default apiFetch;
