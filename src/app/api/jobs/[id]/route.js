import { getJobFromBackendById } from "@/libs/careersApi";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
	const { id } = await params;
	const job = await getJobFromBackendById(id);

	if (!job) {
		return NextResponse.json({ message: "Job not found." }, { status: 404 });
	}

	return NextResponse.json({ job });
}
