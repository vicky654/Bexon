"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import BlogForm from "@/components/BlogForm";
import Breadcrumbs from "@/components/Breadcrumbs";

function EditBlog() {
	const { id } = useParams();
	const router = useRouter();
	const [blog, setBlog] = useState(null);
	const [error, setError] = useState("");

	useEffect(() => {
		apiFetch(`/api/admin/blogs/${id}`)
			.then(data => setBlog(data.blog))
			.catch(err => setError(err.message));
	}, [id]);

	const handleSubmit = async values => {
		await apiFetch(`/api/admin/blogs/${id}`, {
			method: "PUT",
			body: JSON.stringify(values),
		});
		router.push("/blogs");
	};

	const crumbs = (
		<Breadcrumbs
			items={[
				{ label: "Dashboard", href: "/" },
				{ label: "Blogs", href: "/blogs" },
				{ label: "Edit Post" },
			]}
		/>
	);

	if (error) {
		return (
			<div>
				{crumbs}
				<p className="error">{error}</p>
			</div>
		);
	}

	if (!blog) {
		return (
			<div>
				{crumbs}
				<div className="form skeleton-form">
					<span className="skeleton" style={{ width: "40%", height: "16px" }} />
					<span className="skeleton" style={{ width: "100%", height: "16px" }} />
					<span className="skeleton" style={{ width: "100%", height: "220px" }} />
				</div>
			</div>
		);
	}

	return (
		<div>
			{crumbs}
			<div className="page-header">
				<div>
					<h1>Edit Post</h1>
					<p className="dashboard-subtitle">{blog.title}</p>
				</div>
			</div>
			<BlogForm initialValues={blog} onSubmit={handleSubmit} submitLabel="Save Changes" />
		</div>
	);
}

export default function EditBlogPage() {
	return (
		<RequireAuth>
			<EditBlog />
		</RequireAuth>
	);
}
