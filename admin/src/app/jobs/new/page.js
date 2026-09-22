"use client";

import { useRouter } from "next/navigation";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import JobForm from "@/components/JobForm";
import Breadcrumbs from "@/components/Breadcrumbs";

function NewJob() {
	const router = useRouter();

	const handleSubmit = async values => {
		await apiFetch("/api/admin/jobs", {
			method: "POST",
			body: JSON.stringify(values),
		});
		router.push("/jobs");
	};

	return (
		<div>
			<Breadcrumbs
				items={[
					{ label: "Dashboard", href: "/" },
					{ label: "Careers", href: "/jobs" },
					{ label: "New Job" },
				]}
			/>
			<div className="page-header">
				<div>
					<h1>New Job</h1>
					<p className="dashboard-subtitle">Post a new opening to the careers page.</p>
				</div>
			</div>
			<JobForm onSubmit={handleSubmit} submitLabel="Create Job" />
		</div>
	);
}

export default function NewJobPage() {
	return (
		<RequireAuth>
			<NewJob />
		</RequireAuth>
	);
}
