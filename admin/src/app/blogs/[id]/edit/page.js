"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import BlogForm from "@/components/BlogForm";

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

	if (error) return <p className="error">{error}</p>;
	if (!blog) return <p>Loading...</p>;

	return (
		<div>
			<h1>Edit Post</h1>
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
