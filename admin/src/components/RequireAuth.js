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
		return (
			<div className="admin-shell">
				<aside className="admin-sidebar">
					<div className="admin-sidebar-brand">
						<span className="skeleton" style={{ width: "40px", height: "40px", borderRadius: "10px" }} />
					</div>
					<div className="admin-sidebar-section">
						<span className="skeleton" style={{ width: "80%", height: "14px", margin: "10px 12px" }} />
						<span className="skeleton" style={{ width: "70%", height: "14px", margin: "10px 12px" }} />
						<span className="skeleton" style={{ width: "75%", height: "14px", margin: "10px 12px" }} />
						<span className="skeleton" style={{ width: "65%", height: "14px", margin: "10px 12px" }} />
					</div>
				</aside>
				<main className="admin-main">
					<div className="page">
						<div className="skeleton-form">
							<span className="skeleton" style={{ width: "30%", height: "24px" }} />
							<span className="skeleton" style={{ width: "100%", height: "120px" }} />
							<span className="skeleton" style={{ width: "100%", height: "120px" }} />
						</div>
					</div>
				</main>
			</div>
		);
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
