"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import ContentForm from "@/components/ContentForm";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CONTENT_TABS, kindConfig } from "@/lib/contentKinds";

function NewContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const rawKind = searchParams.get("kind");
	const kind = CONTENT_TABS.some(tab => tab.value === rawKind) ? rawKind : "news";
	const singular = kindConfig(kind).singular;

	const handleSubmit = async values => {
		await apiFetch("/api/admin/content", {
			method: "POST",
			body: JSON.stringify(values),
		});
		router.push("/content");
	};

	return (
		<div>
			<Breadcrumbs
				items={[
					{ label: "Dashboard", href: "/" },
					{ label: "Content", href: "/content" },
					{ label: `New ${singular}` },
				]}
			/>
			<div className="page-header">
				<div>
					<h1>New {singular}</h1>
					<p className="dashboard-subtitle">Create a new {singular.toLowerCase()}.</p>
				</div>
			</div>
			<ContentForm kind={kind} onSubmit={handleSubmit} submitLabel={`Create ${singular}`} />
		</div>
	);
}

export default function NewContentPage() {
	return (
		<RequireAuth>
			<Suspense fallback={null}>
				<NewContent />
			</Suspense>
		</RequireAuth>
	);
}
