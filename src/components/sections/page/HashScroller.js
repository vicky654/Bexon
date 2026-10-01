"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ScrollSmoother } from "@/libs/gsap.config";

// The template's GSAP ScrollSmoother moves #smooth-content itself, so native
// #anchor jumps land in the wrong place. Scroll through the smoother instead,
// on page load, on hashchange, and when a menu link to another section of
// the current page (e.g. /about#our-team while on /about) is clicked.
function scrollToHash(hash) {
	if (!hash || hash.length < 2) return;
	const target = document.getElementById(decodeURIComponent(hash.slice(1)));
	if (!target) return;
	const smoother = ScrollSmoother.get();
	if (smoother) smoother.scrollTo(target, true, "top 110px");
	else target.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function HashScroller() {
	const pathname = usePathname();

	useEffect(() => {
		// Give the smoother (initialised in ClientWrapper) a moment to set up.
		const initial = setTimeout(() => scrollToHash(window.location.hash), 500);
		const onHashChange = () => scrollToHash(window.location.hash);
		const onClick = event => {
			const link = event.target.closest?.("a[href*='#']");
			if (!link || link.origin !== window.location.origin || link.pathname !== window.location.pathname) return;
			setTimeout(() => scrollToHash(link.hash), 60);
		};
		window.addEventListener("hashchange", onHashChange);
		document.addEventListener("click", onClick);
		return () => {
			clearTimeout(initial);
			window.removeEventListener("hashchange", onHashChange);
			document.removeEventListener("click", onClick);
		};
	}, [pathname]);

	return null;
}
