import { NextResponse } from "next/server";

export async function POST(request) {
	const body = await request.json();
	const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

	try {
		const res = await fetch(`${backendUrl}/api/contact`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		const data = await res.json();
		return NextResponse.json(data, { status: res.status });
	} catch (error) {
		console.error("Failed to reach backend for contact submission:", error.message);
		return NextResponse.json(
			{ message: "Failed to send message. Please try again later." },
			{ status: 500 }
		);
	}
}
