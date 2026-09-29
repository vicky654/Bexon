"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SkeletonTableRows } from "@/components/Skeleton";
import { CONTENT_TABS, kindConfig } from "@/lib/contentKinds";

function formatDate(value) {
	if (!value) return "—";
	try {
		return new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
	} catch {
		return "—";
	}
}

function ContentList() {
	const [items, setItems] = useState(null);
	const [error, setError] = useState("");
	const [kind, setKind] = useState("news");
	const latestKind = useRef("news");

	const loadItems = () => {
		setError("");
		const requestedKind = kind;
		latestKind.current = requestedKind;
		apiFetch(`/api/admin/content?kind=${requestedKind}`)
			.then(data => {
				if (latestKind.current === requestedKind) {
					setItems(data.items || []);
				}
			})
			.catch(err => {
				if (latestKind.current === requestedKind) {
					setError(err.message);
				}
			});
	};

	useEffect(() => {
		setItems(null);
		loadItems();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [kind]);

	const handleDelete = async id => {
		if (!confirm("Delete this item? This can't be undone.")) return;
		try {
			await apiFetch(`/api/admin/content/${id}`, { method: "DELETE" });
			loadItems();
		} catch (err) {
			setError(err.message);
		}
	};

	const isLoading = items === null;
	const singular = kindConfig(kind).singular;

	return (
		<div>
			<Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Content" }]} />
			<div className="page-header">
				<div>
					<h1>Content</h1>
					<p className="dashboard-subtitle">Manage news, events and resources shown on the site.</p>
				</div>
				<div className="page-header-actions">
					<Link href={`/content/new?kind=${kind}`} className="button">
						New {singular}
					</Link>
				</div>
			</div>
			{error ? <p className="error">{error}</p> : null}
			<div className="filter-tabs" role="tablist">
				{CONTENT_TABS.map(tab => (
					<button
						key={tab.value}
						type="button"
						role="tab"
						aria-selected={kind === tab.value}
						className={`filter-tab${kind === tab.value ? " filter-tab-active" : ""}`}
						onClick={() => setKind(tab.value)}
					>
						{tab.label}
					</button>
				))}
			</div>
			<table className="table">
				<thead>
					<tr>
						<th>Title</th>
						<th>Status</th>
						<th>Date</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{isLoading ? (
						<SkeletonTableRows columns={4} rows={5} />
					) : items.length ? (
						items.map(item => (
							<tr key={item.id}>
								<td>{item.title}</td>
								<td>
									<span className={`badge ${item.published ? "badge-good" : "badge-neutral"}`}>
										{item.published ? "Published" : "Draft"}
									</span>
								</td>
								<td className="table-muted">
									{formatDate(item.kind === "event" ? item.startsAt : item.publishedAt)}
								</td>
								<td>
									<div className="table-actions">
										<Link href={`/content/${item.id}/edit`}>Edit</Link>
										<button
											type="button"
											className="table-action-danger"
											onClick={() => handleDelete(item.id)}
										>
											Delete
										</button>
									</div>
								</td>
							</tr>
						))
					) : (
						<tr>
							<td colSpan={4} className="dashboard-empty">
								Nothing here yet.
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}

export default function ContentPage() {
	return (
		<RequireAuth>
			<ContentList />
		</RequireAuth>
	);
}
