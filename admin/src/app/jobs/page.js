"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SkeletonTableRows } from "@/components/Skeleton";

function JobsList() {
	const router = useRouter();
	const [jobs, setJobs] = useState(null);
	const [error, setError] = useState("");

	const loadJobs = () => {
		apiFetch("/api/admin/jobs")
			.then(data => setJobs(data.jobs || []))
			.catch(err => setError(err.message));
	};

	useEffect(() => {
		loadJobs();
	}, []);

	const handleTogglePublished = async (e, job) => {
		e.stopPropagation();
		try {
			await apiFetch(`/api/admin/jobs/${job.id}`, {
				method: "PUT",
				body: JSON.stringify({ published: !job.published }),
			});
			loadJobs();
		} catch (err) {
			setError(err.message);
		}
	};

	const isLoading = jobs === null;

	return (
		<div>
			<Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Careers" }]} />
			<div className="page-header">
				<div>
					<h1>Careers</h1>
					<p className="dashboard-subtitle">
						{isLoading ? "Loading..." : `${jobs.length} job posting${jobs.length === 1 ? "" : "s"} total`}
					</p>
				</div>
				<div className="page-header-actions">
					<Link href="/jobs/new" className="button">
						New Job
					</Link>
				</div>
			</div>
			{error ? <p className="error">{error}</p> : null}
			<table className="table">
				<thead>
					<tr>
						<th>Title</th>
						<th>Department</th>
						<th>Location</th>
						<th>Type</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{isLoading ? (
						<SkeletonTableRows columns={5} rows={5} />
					) : jobs.length ? (
						jobs.map(job => (
							<tr
								key={job.id}
								className="table-row-clickable"
								onClick={() => router.push(`/jobs/${job.id}/edit`)}
							>
								<td>{job.title}</td>
								<td className="table-muted">{job.department || "—"}</td>
								<td className="table-muted">{job.location || "—"}</td>
								<td className="table-muted">{job.type || "—"}</td>
								<td onClick={e => e.stopPropagation()}>
									<div className="switch-row">
										<button
											type="button"
											role="switch"
											aria-checked={job.published}
											className={`switch ${job.published ? "switch-on" : ""}`}
											onClick={e => handleTogglePublished(e, job)}
											title={job.published ? "Click to unpublish" : "Click to publish"}
										>
											<span className="switch-knob" />
										</button>
										<span className={`switch-label ${job.published ? "switch-label-on" : ""}`}>
											{job.published ? "Published" : "Draft"}
										</span>
									</div>
								</td>
							</tr>
						))
					) : (
						<tr>
							<td colSpan={5} className="dashboard-empty">
								No job postings yet. Create one to start accepting applications.
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}

export default function JobsPage() {
	return (
		<RequireAuth>
			<JobsList />
		</RequireAuth>
	);
}
