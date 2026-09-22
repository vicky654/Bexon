"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import apiFetch from "@/lib/api";
import { ExternalLinkIcon, LogoutIcon } from "./Icons";
import { NAV_LINKS } from "@/lib/navLinks";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4000";

export default function AdminSidebar({ open, onClose, variant = "overlay", expanded = false }) {
	const router = useRouter();
	const pathname = usePathname();
	const [counts, setCounts] = useState({ messages: 0, applications: 0 });

	useEffect(() => {
		Promise.all([
			apiFetch("/api/admin/messages").catch(() => ({ messages: [] })),
			apiFetch("/api/admin/job-applications").catch(() => ({ applications: [] })),
		]).then(([messagesData, applicationsData]) => {
			setCounts({
				messages: (messagesData.messages || []).filter(m => m.status === "new").length,
				applications: (applicationsData.applications || []).filter(a => a.status === "new").length,
			});
		});
	}, [pathname]);

	const handleLogout = async () => {
		await apiFetch("/api/admin/logout", { method: "POST" });
		router.push("/login");
	};

	const isActive = href => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

	const isOverlay = variant === "overlay";
	const isMini = variant === "mini";
	const isCollapsedMini = isMini && !expanded;

	const asideClassName = [
		"admin-sidebar",
		isOverlay ? (open ? "admin-sidebar-open" : "") : "admin-sidebar-docked",
		isMini ? "admin-sidebar-mini" : "",
		isMini && expanded ? "admin-sidebar-mini-expanded" : "",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<>
			{isOverlay && open ? (
				<div className="admin-sidebar-backdrop" onClick={onClose} aria-hidden="true" />
			) : null}
			<aside className={asideClassName}>
				<div className="admin-sidebar-brand">
					<div className="admin-sidebar-logo-wrap">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src="/images/logo.png" alt="DPDP Consultants" className="admin-sidebar-logo" />
					</div>
					<span className="admin-sidebar-brand-sub">Admin Panel</span>
				</div>

				<div className="admin-sidebar-section">
					<span className="admin-sidebar-section-label">Main Menu</span>
					<nav className="admin-sidebar-nav">
						{NAV_LINKS.map(({ href, label, Icon, badgeKey }) => (
							<Link
								key={href}
								href={href}
								onClick={isOverlay ? onClose : undefined}
								title={isCollapsedMini ? label : undefined}
								className={`admin-sidebar-link${isActive(href) ? " admin-sidebar-link-active" : ""}`}
							>
								<Icon size={18} />
								<span className="admin-sidebar-link-label">{label}</span>
								{badgeKey && counts[badgeKey] > 0 ? (
									<span className="admin-sidebar-badge">{counts[badgeKey]}</span>
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
						title={isCollapsedMini ? "View Live Site" : undefined}
						className="admin-sidebar-link"
					>
						<ExternalLinkIcon size={18} />
						<span className="admin-sidebar-link-label">View Live Site</span>
					</a>
					<button
						type="button"
						title={isCollapsedMini ? "Log out" : undefined}
						className="admin-sidebar-link admin-sidebar-logout"
						onClick={handleLogout}
					>
						<LogoutIcon size={18} />
						<span className="admin-sidebar-link-label">Log out</span>
					</button>
				</div>
			</aside>
		</>
	);
}
