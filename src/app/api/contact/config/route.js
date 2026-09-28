import { forwardContactRequest } from "@/libs/contactProxy";

export async function GET(request) {
	return forwardContactRequest(request, "/config", "GET");
}
