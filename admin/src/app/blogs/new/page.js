"use client";

import { useRouter } from "next/navigation";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import BlogForm from "@/components/BlogForm";
import Breadcrumbs from "@/components/Breadcrumbs";

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
			<Breadcrumbs
				items={[
					{ label: "Dashboard", href: "/" },
					{ label: "Blogs", href: "/blogs" },
					{ label: "New Post" },
				]}
			/>
			<div className="page-header">
				<div>
					<h1>New Post</h1>
					<p className="dashboard-subtitle">Write and publish a new blog post.</p>
				</div>
			</div>
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
