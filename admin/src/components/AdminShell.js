"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminShell({ children }) {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="admin-shell">
			<AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
			<div className="admin-main">
				<AdminTopbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
				<div className="page">{children}</div>
			</div>
		</div>
	);
}
