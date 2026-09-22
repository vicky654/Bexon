"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import apiFetch from "@/lib/api";
import { MenuIcon, BellIcon, ExternalLinkIcon, LogoutIcon } from "./Icons";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4000";

export default function AdminTopbar({ onMenuClick }) {
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

	return (
		<header className="admin-topbar">
			<div className="admin-topbar-left">
				<button
					type="button"
					className="admin-topbar-menu-btn"
					onClick={onMenuClick}
					aria-label="Toggle navigation"
				>
					<MenuIcon size={18} />
				</button>
				<Link href="/" className="admin-topbar-brand">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src="/images/logo.png" alt="DPDP Consultants" />
					<span>Admin Panel</span>
				</Link>
			</div>

			<div className="admin-topbar-right">
				<Link href="/messages" className="admin-topbar-icon-btn" title="Messages" aria-label="Messages">
					<BellIcon size={18} />
					{unreadCount > 0 ? <span className="admin-topbar-icon-badge">{unreadCount}</span> : null}
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
