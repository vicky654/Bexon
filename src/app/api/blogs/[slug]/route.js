import getBlogs from "@/libs/getBlogs";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
	const { slug } = await params;
	const blog = getBlogs()?.find((item) => item.slug === slug);

	if (!blog) {
		return NextResponse.json({ message: "Blog not found" }, { status: 404 });
	}

	return NextResponse.json({ blog });
}
