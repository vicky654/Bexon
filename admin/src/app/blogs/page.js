"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SkeletonTableRows } from "@/components/Skeleton";
import { DownloadIcon, UploadIcon } from "@/components/Icons";
import { exportBlogs, downloadSampleImportFile, parseImportFile } from "@/lib/blogImportExport";
import PostPreviewModal from "@/components/PostPreviewModal";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4000";

function BlogsList() {
	const [blogs, setBlogs] = useState(null);
	const [error, setError] = useState("");
	const [selectedIds, setSelectedIds] = useState([]);
	const [previewBlog, setPreviewBlog] = useState(null);
	const [isBulkWorking, setIsBulkWorking] = useState(false);
	const [isImporting, setIsImporting] = useState(false);
	const [importSummary, setImportSummary] = useState(null);
	const importInputRef = useRef(null);

	const loadBlogs = () => {
		apiFetch("/api/admin/blogs")
			.then(data => setBlogs(data.blogs || []))
			.catch(err => setError(err.message));
	};

	useEffect(() => {
		loadBlogs();
	}, []);

	const isLoading = blogs === null;
	const allSelected = !isLoading && blogs.length > 0 && selectedIds.length === blogs.length;

	const toggleSelectAll = () => {
		setSelectedIds(allSelected ? [] : blogs.map(b => b.id));
	};

	const toggleSelectOne = id => {
		setSelectedIds(prev =>
			prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
		);
	};

	const handleDelete = async id => {
		if (!confirm("Delete this post?")) return;
		try {
			await apiFetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
			setPreviewBlog(prev => (prev && prev.id === id ? null : prev));
			loadBlogs();
		} catch (err) {
			setError(err.message);
		}
	};

	const handleBulkDelete = async () => {
		if (!confirm(`Delete ${selectedIds.length} selected post(s)?`)) return;
		setIsBulkWorking(true);
		try {
			await Promise.all(
				selectedIds.map(id => apiFetch(`/api/admin/blogs/${id}`, { method: "DELETE" }))
			);
			setSelectedIds([]);
			loadBlogs();
		} catch (err) {
			setError(err.message);
		} finally {
			setIsBulkWorking(false);
		}
	};

	const handleBulkPublish = async published => {
		setIsBulkWorking(true);
		try {
			await Promise.all(
				selectedIds.map(id =>
					apiFetch(`/api/admin/blogs/${id}`, {
						method: "PUT",
						body: JSON.stringify({ published }),
					})
				)
			);
			setSelectedIds([]);
			loadBlogs();
		} catch (err) {
			setError(err.message);
		} finally {
			setIsBulkWorking(false);
		}
	};

	const handleExport = () => {
		if (blogs?.length) exportBlogs(blogs);
	};

	const handleImportClick = () => {
		importInputRef.current?.click();
	};

	const handleImportFile = async e => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;

		setIsImporting(true);
		setImportSummary(null);
		try {
			const entries = await parseImportFile(file);
			let created = 0;
			const failures = [];

			for (const entry of entries) {
				if (!entry.title || !entry.slug) {
					failures.push(`"${entry.title || entry.slug || "(untitled)"}" — missing title or slug`);
					continue;
				}
				try {
					await apiFetch("/api/admin/blogs", {
						method: "POST",
						body: JSON.stringify(entry),
					});
					created += 1;
				} catch (err) {
					failures.push(`"${entry.title}" — ${err.message}`);
				}
			}

			setImportSummary({ total: entries.length, created, failures });
			loadBlogs();
		} catch (err) {
			setImportSummary({ total: 0, created: 0, failures: [err.message] });
		} finally {
			setIsImporting(false);
		}
	};

	return (
		<div>
			<Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Blogs" }]} />
			<div className="page-header">
				<div>
					<h1>Blogs</h1>
					<p className="dashboard-subtitle">
						{isLoading ? "Loading..." : `${blogs.length} post${blogs.length === 1 ? "" : "s"} total`}
					</p>
				</div>
				<div className="page-header-actions">
					<button
						type="button"
						className="button button-secondary"
						onClick={handleExport}
						disabled={isLoading || !blogs.length}
					>
						<DownloadIcon size={16} /> Export
					</button>
					<button
						type="button"
						className="button button-secondary"
						onClick={handleImportClick}
						disabled={isImporting}
					>
						<UploadIcon size={16} /> {isImporting ? "Importing..." : "Import"}
					</button>
					<button
						type="button"
						className="button-link button-link-primary"
						onClick={downloadSampleImportFile}
					>
						Sample file
					</button>
					<input
						ref={importInputRef}
						type="file"
						accept="application/json"
						className="editor-file-input"
						onChange={handleImportFile}
					/>
					<Link href="/blogs/new" className="button">
						New Post
					</Link>
				</div>
			</div>
			{error ? <p className="error">{error}</p> : null}
			{importSummary ? (
				<div className={`import-summary${importSummary.failures.length ? " import-summary-warn" : ""}`}>
					<div className="import-summary-text">
						Imported {importSummary.created} of {importSummary.total} post
						{importSummary.total === 1 ? "" : "s"}.
						{importSummary.failures.length ? (
							<ul>
								{importSummary.failures.map((msg, idx) => (
									<li key={idx}>{msg}</li>
								))}
							</ul>
						) : null}
					</div>
					<button
						type="button"
						className="preview-close"
						onClick={() => setImportSummary(null)}
						aria-label="Dismiss"
					>
						✕
					</button>
				</div>
			) : null}
			<table className="table">
				<thead>
					<tr>
						<th className="table-checkbox-col">
							<input
								type="checkbox"
								checked={allSelected}
								onChange={toggleSelectAll}
								aria-label="Select all posts"
							/>
						</th>
						<th>Title</th>
						<th>Slug</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{isLoading ? (
						<SkeletonTableRows columns={4} rows={6} />
					) : (
						blogs.map(blog => (
							<tr
								key={blog.id}
								className={`table-row-clickable ${
									selectedIds.includes(blog.id) ? "table-row-selected" : ""
								}`}
								onClick={() => setPreviewBlog(blog)}
							>
								<td className="table-checkbox-col" onClick={e => e.stopPropagation()}>
									<input
										type="checkbox"
										checked={selectedIds.includes(blog.id)}
										onChange={() => toggleSelectOne(blog.id)}
										aria-label={`Select ${blog.title}`}
									/>
								</td>
								<td>{blog.title}</td>
								<td className="table-muted">{blog.slug}</td>
								<td>
									<span
										className={`badge ${blog.published ? "badge-good" : "badge-neutral"}`}
									>
										{blog.published ? "Published" : "Draft"}
									</span>
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>

			{selectedIds.length > 0 ? (
				<div className="bulk-bar">
					<span className="bulk-bar-count">{selectedIds.length} selected</span>
					<button
						type="button"
						className="bulk-bar-btn"
						disabled={isBulkWorking}
						onClick={() => handleBulkPublish(true)}
					>
						Publish
					</button>
					<button
						type="button"
						className="bulk-bar-btn"
						disabled={isBulkWorking}
						onClick={() => handleBulkPublish(false)}
					>
						Unpublish
					</button>
					<button
						type="button"
						className="bulk-bar-btn bulk-bar-btn-danger"
						disabled={isBulkWorking}
						onClick={handleBulkDelete}
					>
						Delete
					</button>
					<button
						type="button"
						className="bulk-bar-close"
						onClick={() => setSelectedIds([])}
						aria-label="Clear selection"
					>
						✕
					</button>
				</div>
			) : null}

			{previewBlog ? (
				<PostPreviewModal
					values={previewBlog}
					onClose={() => setPreviewBlog(null)}
					editHref={`/blogs/${previewBlog.id}/edit`}
					viewHref={`${SITE_URL}/blogs/${previewBlog.slug}`}
					onDelete={() => handleDelete(previewBlog.id)}
				/>
			) : null}
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
