"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import JobForm from "@/components/JobForm";
import Breadcrumbs from "@/components/Breadcrumbs";

function EditJob() {
	const { id } = useParams();
	const router = useRouter();
	const [job, setJob] = useState(null);
	const [error, setError] = useState("");

	useEffect(() => {
		apiFetch(`/api/admin/jobs/${id}`)
			.then(data => setJob(data.job))
			.catch(err => setError(err.message));
	}, [id]);

	const handleSubmit = async values => {
		await apiFetch(`/api/admin/jobs/${id}`, {
			method: "PUT",
			body: JSON.stringify(values),
		});
		router.push("/jobs");
	};

	const handleDelete = async () => {
		if (!confirm("Delete this job posting? Any applications for it will be deleted too.")) return;
		try {
			await apiFetch(`/api/admin/jobs/${id}`, { method: "DELETE" });
			router.push("/jobs");
		} catch (err) {
			setError(err.message);
		}
	};

	const crumbs = (
		<Breadcrumbs
			items={[
				{ label: "Dashboard", href: "/" },
				{ label: "Careers", href: "/jobs" },
				{ label: "Edit Job" },
			]}
		/>
	);

	if (error && !job) {
		return (
			<div>
				{crumbs}
				<p className="error">{error}</p>
			</div>
		);
	}

	if (!job) {
		return (
			<div>
				{crumbs}
				<div className="form skeleton-form">
					<span className="skeleton" style={{ width: "40%", height: "16px" }} />
					<span className="skeleton" style={{ width: "100%", height: "16px" }} />
					<span className="skeleton" style={{ width: "100%", height: "120px" }} />
				</div>
			</div>
		);
	}

	return (
		<div>
			{crumbs}
			<div className="page-header">
				<div>
					<h1>Edit Job</h1>
					<p className="dashboard-subtitle">{job.title}</p>
				</div>
				<div className="page-header-actions">
					<button type="button" className="button button-secondary" onClick={handleDelete}>
						Delete Job
					</button>
				</div>
			</div>
			{error ? <p className="error">{error}</p> : null}
			<JobForm initialValues={job} onSubmit={handleSubmit} submitLabel="Save Changes" />
		</div>
	);
}

export default function EditJobPage() {
	return (
		<RequireAuth>
			<EditJob />
		</RequireAuth>
	);
}
