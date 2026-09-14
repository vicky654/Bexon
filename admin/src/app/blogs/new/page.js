"use client";

import { useRouter } from "next/navigation";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import BlogForm from "@/components/BlogForm";

function NewBlog() {
	const router = useRouter();

	const handleSubmit = async values => {
		await apiFetch("/api/admin/blogs", {
			method: "POST",
			body: JSON.stringify(values),
		});
		router.push("/blogs");
	};

	return (
		<div>
			<h1>New Post</h1>
			<BlogForm onSubmit={handleSubmit} submitLabel="Create Post" />
		</div>
	);
}

export default function NewBlogPage() {
	return (
		<RequireAuth>
			<NewBlog />
		</RequireAuth>
	);
}
