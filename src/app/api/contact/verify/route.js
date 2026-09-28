import { forwardContactRequest } from "@/libs/contactProxy";

export async function POST(request) {
	return forwardContactRequest(request, "/verify");
}
