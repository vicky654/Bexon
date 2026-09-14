"use client";

import Link from "next/link";

export default function Breadcrumbs({ items }) {
	return (
		<nav className="breadcrumbs" aria-label="Breadcrumb">
			{items.map((item, idx) => {
				const isLast = idx === items.length - 1;
				return (
					<span key={item.label} className="breadcrumb-item">
						{item.href && !isLast ? (
							<Link href={item.href}>{item.label}</Link>
						) : (
							<span className="breadcrumb-current">{item.label}</span>
						)}
						{!isLast ? <span className="breadcrumb-sep">/</span> : null}
					</span>
				);
			})}
		</nav>
	);
}
