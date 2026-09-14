"use client";
import BlogsPrimary from "@/components/sections/blogs/BlogsPrimary";
import HeroInner from "@/components/sections/hero/HeroInner";
import makeText from "@/libs/makeText";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const BlogMain = () => {
	const [filteredItems, setFilteredItems] = useState([]);
	const category = useSearchParams()?.get("category");
	const tag = useSearchParams()?.get("tag");
	const author_role = useSearchParams()?.get("author_role");
	const search = useSearchParams()?.get("search");

	useEffect(() => {
		const params = new URLSearchParams();
		if (category) params.set("category", category);
		if (tag) params.set("tag", tag);
		if (author_role) params.set("author_role", author_role);
		if (search) params.set("search", search);

		fetch(`/api/blogs?${params.toString()}`)
			.then(res => res.json())
			.then(data => setFilteredItems(data?.blogs || []))
			.catch(() => setFilteredItems([]));
	}, [category, tag, author_role, search]);

	return (
		<div>
			<HeroInner
				title={
					category
						? `Category: ${makeText(category, true)}`
						: tag
						? `Tag: ${makeText(tag, true)}`
						: author_role
						? author_role
						: search
						? makeText(search, true)
						: "Read Blog"
				}
				text={
					category
						? `${makeText(category, true)}`
						: tag
						? ` ${makeText(tag, true)}`
						: author_role
						? `${author_role}`
						: search
						? `${makeText(search, true)}`
						: "Blogs"
				}
				breadcrums={
					category || tag || author_role || search
						? [{ name: "Blogs", path: "/blogs" }]
						: []
				}
			/>
			<BlogsPrimary filteredItems={filteredItems} />
		</div>
	);
};

export default BlogMain;
