import { NextResponse } from "next/server";

const backendUrl = () => process.env.BACKEND_URL || "http://localhost:5000";

// Forwards a contact request to the backend, passing along the visitor's IP
// and user agent so the backend can rate-limit and record the device type.
export async function forwardContactRequest(request, path, method = "POST") {
	const headers = { "Content-Type": "application/json" };
	// x-real-ip (set by a trusted reverse proxy) is authoritative when present.
	// Otherwise take the LAST entry of x-forwarded-for, since that's the hop
	// added by our nearest proxy — the first entry is client-supplied and a
	// visitor can set it to whatever they like to spoof their IP.
	const realIp = request.headers.get("x-real-ip");
	const forwardedFor = request.headers.get("x-forwarded-for");
	const ip = realIp || forwardedFor?.split(",").pop().trim();
	if (ip) headers["X-Forwarded-For"] = ip;
	const userAgent = request.headers.get("user-agent");
	if (userAgent) headers["User-Agent"] = userAgent;

	let body;
	if (method === "POST") {
		body = JSON.stringify(await request.json().catch(() => ({})));
	}

	try {
		const res = await fetch(`${backendUrl()}/api/contact${path}`, {
			method,
			headers,
			body,
			cache: "no-store",
		});
		const data = await res.json().catch(() => ({}));
		return NextResponse.json(data, { status: res.status });
	} catch (error) {
		console.error(`Failed to reach backend for contact ${path}:`, error.message);
		return NextResponse.json(
			{ message: "Failed to reach the server. Please try again later." },
			{ status: 502 }
		);
	}
}
