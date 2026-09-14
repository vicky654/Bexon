"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import apiFetch from "@/lib/api";
import {
	DashboardIcon,
	DocumentIcon,
	MailIcon,
	ExternalLinkIcon,
	LogoutIcon,
} from "./Icons";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4000";

const LINKS = [
	{ href: "/", label: "Dashboard", Icon: DashboardIcon },
	{ href: "/blogs", label: "Blogs", Icon: DocumentIcon },
	{ href: "/messages", label: "Messages", Icon: MailIcon, badgeKey: "messages" },
];

export default function AdminSidebar() {
	const router = useRouter();
	const pathname = usePathname();
	const [unreadCount, setUnreadCount] = useState(0);

	useEffect(() => {
		apiFetch("/api/admin/messages")
			.then(data => {
				const count = (data.messages || []).filter(m => m.status === "new").length;
				setUnreadCount(count);
			})
			.catch(() => {});
	}, [pathname]);

	const handleLogout = async () => {
		await apiFetch("/api/admin/logout", { method: "POST" });
		router.push("/login");
	};

	const isActive = href => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

	return (
		<aside className="admin-sidebar">
			<div className="admin-sidebar-brand">
				<div className="admin-header-mark">B</div>
				<div>
					<span className="admin-sidebar-brand-name">Bexon Admin</span>
					<span className="admin-sidebar-brand-sub">Admin Panel</span>
				</div>
			</div>

			<div className="admin-sidebar-section">
				<span className="admin-sidebar-section-label">Main Menu</span>
				<nav className="admin-sidebar-nav">
					{LINKS.map(({ href, label, Icon, badgeKey }) => (
						<Link
							key={href}
							href={href}
							className={`admin-sidebar-link${isActive(href) ? " admin-sidebar-link-active" : ""}`}
						>
							<Icon size={18} />
							<span>{label}</span>
							{badgeKey === "messages" && unreadCount > 0 ? (
								<span className="admin-sidebar-badge">{unreadCount}</span>
							) : null}
						</Link>
					))}
				</nav>
			</div>

			<div className="admin-sidebar-footer">
				<a
					href={SITE_URL}
					target="_blank"
					rel="noopener noreferrer"
					className="admin-sidebar-link"
				>
					<ExternalLinkIcon size={18} />
					<span>View Live Site</span>
				</a>
				<button type="button" className="admin-sidebar-link admin-sidebar-logout" onClick={handleLogout}>
					<LogoutIcon size={18} />
					<span>Log out</span>
				</button>
			</div>
		</aside>
	);
}
