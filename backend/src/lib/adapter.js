function formatDate(date) {
	const d = new Date(date);
	const day = d.getUTCDate();
	const month = d
		.toLocaleString("en-US", { month: "short", timeZone: "UTC" })
		.toUpperCase();
	const year = d.getUTCFullYear();
	return {
		day,
		month,
		date: `${String(day).padStart(2, "0")} ${month} ${year}`,
		date2: d.toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			timeZone: "UTC",
		}),
	};
}

function parseTags(tags) {
	try {
		return tags ? JSON.parse(tags) : [];
	} catch {
		return [];
	}
}

function mapBlogToLegacyShape(blog) {
	const { day, month, date, date2 } = formatDate(blog.publishedAt);

	return {
		id: blog.id,
		slug: blog.slug,
		title: blog.title,
		desc: blog.excerpt || "",
		content: blog.content || "",
		img: blog.img || "/images/blog/blog-1.webp",
		category: blog.category || "",
		tags: parseTags(blog.tags),
		author: blog.author || "",
		author_role: blog.authorRole || "",
		status: blog.status || "",
		day,
		month,
		date,
		date2,
	};
}

function serializeAdminBlog(blog) {
	return { ...blog, tags: parseTags(blog.tags) };
}

module.exports = { mapBlogToLegacyShape, serializeAdminBlog };
