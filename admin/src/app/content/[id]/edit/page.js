"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import ContentForm from "@/components/ContentForm";
import Breadcrumbs from "@/components/Breadcrumbs";
import { kindConfig } from "@/lib/contentKinds";

function EditContent() {
	const { id } = useParams();
	const router = useRouter();
	const [item, setItem] = useState(null);
	const [error, setError] = useState("");

	useEffect(() => {
		apiFetch(`/api/admin/content/${id}`)
			.then(data => setItem(data.item))
			.catch(err => setError(err.message));
	}, [id]);

	const handleSubmit = async values => {
		await apiFetch(`/api/admin/content/${id}`, {
			method: "PUT",
			body: JSON.stringify(values),
		});
		router.push("/content");
	};

	const singular = kindConfig(item?.kind).singular;

	const crumbs = (
		<Breadcrumbs
			items={[
				{ label: "Dashboard", href: "/" },
				{ label: "Content", href: "/content" },
				{ label: `Edit ${singular}` },
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

	if (!item) {
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
					<h1>Edit {singular}</h1>
					<p className="dashboard-subtitle">{item.title}</p>
				</div>
			</div>
			<ContentForm kind={item.kind} initialValues={item} onSubmit={handleSubmit} submitLabel="Save Changes" />
		</div>
	);
}

export default function EditContentPage() {
	return (
		<RequireAuth>
			<EditContent />
		</RequireAuth>
	);
}
