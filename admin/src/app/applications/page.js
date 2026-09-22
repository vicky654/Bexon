"use client";

import { useEffect, useState } from "react";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import Breadcrumbs from "@/components/Breadcrumbs";
import ApplicationDetailModal from "@/components/ApplicationDetailModal";
import { SkeletonTableRows } from "@/components/Skeleton";

const STATUS_BADGE = {
	new: "badge-alert",
	reviewed: "badge-neutral",
	shortlisted: "badge-good",
	rejected: "badge-danger",
};

function initials(name) {
	if (!name) return "?";
	return name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map(part => part[0]?.toUpperCase())
		.join("");
}

function formatDate(value) {
	if (!value) return "";
	try {
		return new Date(value).toLocaleDateString("en-US", { dateStyle: "medium" });
	} catch {
		return value;
	}
}

function ApplicationsList() {
	const [applications, setApplications] = useState(null);
	const [error, setError] = useState("");
	const [selected, setSelected] = useState(null);

	const loadApplications = () => {
		apiFetch("/api/admin/job-applications")
			.then(data => setApplications(data.applications || []))
			.catch(err => setError(err.message));
	};

	useEffect(() => {
		loadApplications();
	}, []);

	const handleStatusChange = async (id, status) => {
		try {
			const data = await apiFetch(`/api/admin/job-applications/${id}`, {
				method: "PUT",
				body: JSON.stringify({ status }),
			});
			setApplications(prev => prev.map(a => (a.id === id ? data.application : a)));
			setSelected(prev => (prev && prev.id === id ? data.application : prev));
		} catch (err) {
			setError(err.message);
		}
	};

	const handleDelete = async id => {
		if (!confirm("Delete this application?")) return;
		try {
			await apiFetch(`/api/admin/job-applications/${id}`, { method: "DELETE" });
			setApplications(prev => prev.filter(a => a.id !== id));
			setSelected(prev => (prev && prev.id === id ? null : prev));
		} catch (err) {
			setError(err.message);
		}
	};

	const isLoading = applications === null;
	const newCount = isLoading ? 0 : applications.filter(a => a.status === "new").length;

	return (
		<div>
			<Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Applications" }]} />
			<div className="page-header">
				<div>
					<h1>Applications</h1>
					<p className="dashboard-subtitle">
						{isLoading ? "Loading..." : `${applications.length} total · ${newCount} new`}
					</p>
				</div>
			</div>
			{error ? <p className="error">{error}</p> : null}
			<table className="table">
				<thead>
					<tr>
						<th>Applicant</th>
						<th>Email</th>
						<th>Applied For</th>
						<th>Received</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{isLoading ? (
						<SkeletonTableRows columns={5} rows={6} />
					) : applications.length ? (
						applications.map(application => (
							<tr
								key={application.id}
								className="table-row-clickable"
								onClick={() => setSelected(application)}
							>
								<td>
									<div className="table-name-cell">
										<span className="dashboard-avatar dashboard-avatar-purple">
											{initials(application.name)}
										</span>
										{application.name}
									</div>
								</td>
								<td className="table-muted">{application.email}</td>
								<td className="table-muted">{application.job?.title || "—"}</td>
								<td className="table-muted">{formatDate(application.createdAt)}</td>
								<td>
									<span className={`badge ${STATUS_BADGE[application.status] || "badge-neutral"}`}>
										{application.status}
									</span>
								</td>
							</tr>
						))
					) : (
						<tr>
							<td colSpan={5} className="dashboard-empty">
								No applications yet.
							</td>
						</tr>
					)}
				</tbody>
			</table>

			{selected ? (
				<ApplicationDetailModal
					application={selected}
					onClose={() => setSelected(null)}
					onStatusChange={handleStatusChange}
					onDelete={handleDelete}
				/>
			) : null}
		</div>
	);
}

export default function ApplicationsPage() {
	return (
		<RequireAuth>
			<ApplicationsList />
		</RequireAuth>
	);
}
