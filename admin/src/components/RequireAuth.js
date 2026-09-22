"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiFetch from "@/lib/api";
import AdminShell from "./AdminShell";

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
				<div className="admin-main">
					<header className="admin-topbar">
						<span className="skeleton" style={{ width: "38px", height: "38px", borderRadius: "9px" }} />
						<span className="skeleton" style={{ width: "120px", height: "18px" }} />
					</header>
					<div className="page">
						<div className="skeleton-form">
							<span className="skeleton" style={{ width: "30%", height: "24px" }} />
							<span className="skeleton" style={{ width: "100%", height: "120px" }} />
							<span className="skeleton" style={{ width: "100%", height: "120px" }} />
						</div>
					</div>
				</div>
			</div>
		);
	}

	return <AdminShell>{children}</AdminShell>;
}
