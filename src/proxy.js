import { NextResponse } from "next/server";
import { findRedirect } from "@/content/redirects.cjs";

// Old PHP site addresses -> new pages, as permanent 301 redirects to the clean
// new URL. (next.config redirects() would copy the old query string, e.g.
// ?id=76&title=..., onto the new address; this drops it.) The table lives in
// src/content/redirects.cjs and is checked by validate.test.js.
export function proxy(request) {
	const { pathname, searchParams } = request.nextUrl;
	const to = findRedirect(pathname, searchParams);
	if (!to) return NextResponse.next();
	return NextResponse.redirect(new URL(to, request.url), 301);
}

export const config = {
	matcher: "/(.*\\.php)",
};
