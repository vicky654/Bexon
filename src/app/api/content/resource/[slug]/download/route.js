const backendUrl = () => process.env.BACKEND_URL || "http://localhost:5000";

export async function GET(request, { params }) {
	const { slug } = await params;
	const token = new URL(request.url).searchParams.get("token") || "";
	const query = token ? `?token=${encodeURIComponent(token)}` : "";
	try {
		const res = await fetch(`${backendUrl()}/api/content/resource/${encodeURIComponent(slug)}/download${query}`, {
			cache: "no-store",
		});
		const headers = new Headers();
		for (const name of ["content-type", "content-disposition", "content-length", "cache-control"]) {
			const value = res.headers.get(name);
			if (value) headers.set(name, value);
		}
		return new Response(res.body, { status: res.status, headers });
	} catch (error) {
		console.error("Failed to reach backend for resource download:", error.message);
		return Response.json({ message: "The download is unavailable right now. Please try again." }, { status: 502 });
	}
}
