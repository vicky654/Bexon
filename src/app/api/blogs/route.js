import { getBlogsFromBackend } from "@/libs/blogsApi";
import { NextResponse } from "next/server";

export async function GET(request) {
	const { searchParams } = new URL(request.url);

	const blogs = await getBlogsFromBackend({
		category: searchParams.get("category"),
		tag: searchParams.get("tag"),
		author_role: searchParams.get("author_role"),
		search: searchParams.get("search"),
	});

	return NextResponse.json({ blogs });
}
