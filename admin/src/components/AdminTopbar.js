"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import apiFetch from "@/lib/api";
import { MenuIcon, BellIcon, ExternalLinkIcon, LogoutIcon } from "./Icons";
import { NAV_LINKS } from "@/lib/navLinks";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4000";

export default function AdminTopbar({ onMenuClick, layout = "overlay", showMenuButton = true }) {
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
	const isHorizontal = layout === "horizontal";
	// Docked/mini sidebars already show the brand logo, so skip it here to avoid showing it twice.
	const showBrandLogo = layout === "overlay" || layout === "horizontal";

	return (
		<header className="admin-topbar">
			<div className="admin-topbar-left">
				{showMenuButton ? (
					<button
						type="button"
						className="admin-topbar-menu-btn"
						onClick={onMenuClick}
						aria-label="Toggle navigation"
					>
						<MenuIcon size={18} />
					</button>
				) : null}
				{showBrandLogo ? (
					<Link href="/" className="admin-topbar-brand">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src="/images/logo.png" alt="DPDP Consultants" />
					</Link>
				) : null}
				{isHorizontal ? (
					<nav className="admin-topbar-nav">
						{NAV_LINKS.map(({ href, label, Icon, badgeKey }) => (
							<Link
								key={href}
								href={href}
								className={`admin-topbar-nav-link${isActive(href) ? " admin-topbar-nav-link-active" : ""}`}
							>
								<Icon size={16} />
								<span>{label}</span>
								{badgeKey && counts[badgeKey] > 0 ? (
									<span className="admin-topbar-nav-badge">{counts[badgeKey]}</span>
								) : null}
							</Link>
						))}
					</nav>
				) : null}
			</div>

			<div className="admin-topbar-right">
				<Link href="/messages" className="admin-topbar-icon-btn" title="Messages" aria-label="Messages">
					<BellIcon size={18} />
					{counts.messages > 0 ? <span className="admin-topbar-icon-badge">{counts.messages}</span> : null}
				</Link>
				<a
					href={SITE_URL}
					target="_blank"
					rel="noopener noreferrer"
					className="admin-topbar-icon-btn"
					title="View Live Site"
					aria-label="View Live Site"
				>
					<ExternalLinkIcon size={18} />
				</a>
				<div className="admin-topbar-avatar" title="Admin">
					A
				</div>
				<button type="button" className="admin-topbar-logout" onClick={handleLogout}>
					<LogoutIcon size={16} />
					<span>Log out</span>
				</button>
			</div>
		</header>
	);
}
