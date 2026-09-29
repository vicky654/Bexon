"use client";
import { usePathname } from "next/navigation";

// A top-level item is active when the current path is its href, or any of
// its children's hrefs, or sits under one of them (e.g. /blogs/some-post).
export default function useActiveLink() {
	const pathname = usePathname() || "/";
	const matches = href => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
	return item => matches(item.href) || Boolean(item.children?.some(child => matches(child.href)));
}
