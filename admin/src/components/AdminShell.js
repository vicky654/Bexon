"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { SidebarLayoutContext, SIDEBAR_LAYOUT_STORAGE_KEY } from "@/lib/sidebarLayout";

export default function AdminShell({ children }) {
	const [layout, setLayoutState] = useState("overlay");
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [railExpanded, setRailExpanded] = useState(false);

	useEffect(() => {
		try {
			const stored = localStorage.getItem(SIDEBAR_LAYOUT_STORAGE_KEY);
			if (stored) setLayoutState(stored);
		} catch {}
	}, []);

	const setLayout = value => {
		setLayoutState(value);
		setSidebarOpen(false);
		setRailExpanded(false);
		try {
			localStorage.setItem(SIDEBAR_LAYOUT_STORAGE_KEY, value);
		} catch {}
	};

	const handleMenuClick = () => {
		if (layout === "mini") {
			setRailExpanded(prev => !prev);
		} else if (layout === "overlay") {
			setSidebarOpen(prev => !prev);
		}
	};

	const showSidebar = layout !== "horizontal";
	const showMenuButton = layout === "overlay" || layout === "mini";

	return (
		<SidebarLayoutContext.Provider value={{ layout, setLayout }}>
			<div className="admin-shell">
				{showSidebar ? (
					<AdminSidebar
						variant={layout}
						open={sidebarOpen}
						expanded={railExpanded}
						onClose={() => setSidebarOpen(false)}
					/>
				) : null}
				<div className="admin-main">
					<AdminTopbar layout={layout} onMenuClick={handleMenuClick} showMenuButton={showMenuButton} />
					<div className="page">{children}</div>
				</div>
			</div>
		</SidebarLayoutContext.Provider>
	);
}
