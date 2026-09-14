import filterItems from "@/libs/filterItems";
import getBlogs from "@/libs/getBlogs";
import { NextResponse } from "next/server";

export async function GET(request) {
	const { searchParams } = new URL(request.url);
	const category = searchParams.get("category");
	const tag = searchParams.get("tag");
	const author_role = searchParams.get("author_role");
	const search = searchParams.get("search");

	const items = getBlogs();

	const filteredItems = filterItems(
		items,
		category
			? "category"
			: tag
			? "tags"
			: author_role
			? "role"
			: search
			? "search"
			: "",
		category ? category : tag ? tag : author_role ? author_role : search
	);

	return NextResponse.json({ blogs: filteredItems });
}
