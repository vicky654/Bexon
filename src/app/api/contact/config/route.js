import { forwardContactRequest } from "@/libs/contactProxy";

export async function GET(request) {
	const type = new URL(request.url).searchParams.get("type") || "";
	const query = type ? `?type=${encodeURIComponent(type)}` : "";
	return forwardContactRequest(request, `/config${query}`, "GET");
}
