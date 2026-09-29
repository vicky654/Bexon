const backendUrl = () => process.env.BACKEND_URL || "http://localhost:5000";

export async function GET(request, { params }) {
	const { slug } = await params;
	const token = new URL(request.url).searchParams.get("token") || "";
	const query = token ? `?token=${encodeURIComponent(token)}` : "";

	const redirectTo = reason =>
		Response.redirect(new URL(`/resources/${encodeURIComponent(slug)}?download=${reason}`, request.url), 302);

	try {
		const res = await fetch(`${backendUrl()}/api/content/resource/${encodeURIComponent(slug)}/download${query}`, {
			cache: "no-store",
		});
		if (res.status === 403) return redirectTo("expired");
		if (!res.ok) return redirectTo("unavailable");

		const headers = new Headers();
		for (const name of ["content-type", "content-disposition", "content-length", "cache-control"]) {
			const value = res.headers.get(name);
			if (value) headers.set(name, value);
		}
		return new Response(res.body, { status: res.status, headers });
	} catch (error) {
		console.error("Failed to reach backend for resource download:", error.message);
		return redirectTo("unavailable");
	}
}
