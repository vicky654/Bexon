"use client";
import { usePathname } from "next/navigation";

// A top-level item is active when the current path is its href, or any of
// its children's hrefs, or sits under one of them (e.g. /blogs/some-post).
// Query strings and hashes (/resources?type=report, /about#our-team) are
// ignored when matching.
export default function useActiveLink() {
	const pathname = usePathname() || "/";
	const matches = href => {
		const path = href.split(/[?#]/)[0] || "/";
		return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
	};
	return item => matches(item.href) || Boolean(item.children?.some(child => matches(child.href)));
}
