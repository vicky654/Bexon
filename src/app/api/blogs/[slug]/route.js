import { getBlogFromBackendBySlug } from "@/libs/blogsApi";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
	const { slug } = await params;
	const blog = await getBlogFromBackendBySlug(slug);

	if (!blog) {
		return NextResponse.json({ message: "Blog not found" }, { status: 404 });
	}

	return NextResponse.json({ blog });
}
