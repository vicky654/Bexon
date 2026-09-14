"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";

function BlogsList() {
	const [blogs, setBlogs] = useState([]);
	const [error, setError] = useState("");

	const loadBlogs = () => {
		apiFetch("/api/admin/blogs")
			.then(data => setBlogs(data.blogs || []))
			.catch(err => setError(err.message));
	};

	useEffect(() => {
		loadBlogs();
	}, []);

	const handleDelete = async id => {
		if (!confirm("Delete this post?")) return;
		try {
			await apiFetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
			loadBlogs();
		} catch (err) {
			setError(err.message);
		}
	};

	return (
		<div>
			<div className="page-header">
				<h1>Blogs</h1>
				<Link href="/blogs/new" className="button">
					New Post
				</Link>
			</div>
			{error ? <p className="error">{error}</p> : null}
			<table className="table">
				<thead>
					<tr>
						<th>Title</th>
						<th>Slug</th>
						<th>Published</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{blogs.map(blog => (
						<tr key={blog.id}>
							<td>{blog.title}</td>
							<td>{blog.slug}</td>
							<td>{blog.published ? "Yes" : "Draft"}</td>
							<td>
								<Link href={`/blogs/${blog.id}/edit`}>Edit</Link>{" "}
								<button
									type="button"
									className="button-link"
									onClick={() => handleDelete(blog.id)}
								>
									Delete
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default function BlogsPage() {
	return (
		<RequireAuth>
			<BlogsList />
		</RequireAuth>
	);
}
