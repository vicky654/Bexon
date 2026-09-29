"use client";
import useActiveLink from "@/hooks/useActiveLink";
import { NAVIGATION } from "@/content/navigation";
import Link from "next/link";

const Navbar = () => {
	const isActive = useActiveLink();
	return (
		<div className="menu-area d-none d-lg-inline-flex align-items-center">
			<nav id="mobile-menu" className="mainmenu">
				<ul>
					{NAVIGATION.map(item => (
						<li
							key={item.label}
							className={`${item.children ? "has-dropdown" : ""} ${isActive(item) ? "current-menu-ancestor" : ""}`}
						>
							<Link href={item.href}>{item.label}</Link>
							{item.children ? (
								<ul className="sub-menu">
									{item.children.map(child => (
										<li key={child.href + child.label}>
											<Link href={child.href}>{child.label}</Link>
										</li>
									))}
								</ul>
							) : null}
						</li>
					))}
				</ul>
			</nav>
		</div>
	);
};

export default Navbar;
