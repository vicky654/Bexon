"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiFetch from "@/lib/api";
import AdminSidebar from "./AdminSidebar";

export default function RequireAuth({ children }) {
	const router = useRouter();
	const [status, setStatus] = useState("checking");

	useEffect(() => {
		apiFetch("/api/admin/me")
			.then(() => setStatus("authenticated"))
			.catch(() => {
				setStatus("redirecting");
				router.push("/login");
			});
	}, [router]);

	if (status !== "authenticated") {
		return <div className="admin-loading">Loading...</div>;
	}

	return (
		<div className="admin-shell">
			<AdminSidebar />
			<main className="admin-main">
				<div className="page">{children}</div>
			</main>
		</div>
	);
}
