import { getJobsFromBackend } from "@/libs/careersApi";
import { NextResponse } from "next/server";

export async function GET() {
	const jobs = await getJobsFromBackend();
	return NextResponse.json({ jobs });
}
