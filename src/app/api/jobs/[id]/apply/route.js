import { NextResponse } from "next/server";

export async function POST(request, { params }) {
	const { id } = await params;
	const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

	try {
		const formData = await request.formData();
		const res = await fetch(`${backendUrl}/api/jobs/${id}/apply`, {
			method: "POST",
			body: formData,
		});
		const data = await res.json();
		return NextResponse.json(data, { status: res.status });
	} catch (error) {
		console.error("Failed to reach backend for job application:", error.message);
		return NextResponse.json(
			{ message: "Failed to submit application. Please try again later." },
			{ status: 500 }
		);
	}
}
