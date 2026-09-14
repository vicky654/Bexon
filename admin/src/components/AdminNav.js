"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import apiFetch from "@/lib/api";

export default function AdminNav() {
	const router = useRouter();

	const handleLogout = async () => {
		await apiFetch("/api/admin/logout", { method: "POST" });
		router.push("/login");
	};

	return (
		<nav className="nav">
			<Link href="/blogs">Blogs</Link>
			<Link href="/messages">Messages</Link>
			<button type="button" className="button-link" onClick={handleLogout}>
				Log out
			</button>
		</nav>
	);
}
