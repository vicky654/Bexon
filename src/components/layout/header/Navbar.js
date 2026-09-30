"use client";
import useActiveLink from "@/hooks/useActiveLink";
import { NAVIGATION } from "@/content/navigation";
import Link from "next/link";

// Icon mega menu (template "mega-menu-service" design): icon, title and a
// sliding double arrow on hover.
const MegaMenu = ({ items }) => (
	<ul className="sub-menu mega-menu-service">
		{items.map(child => (
			<li key={child.href + child.label}>
				<Link className="mega-menu-service-single" href={child.href}>
					<span className="mega-menu-service-icon">
						<i className={child.icon || "tji-service-1"}></i>
					</span>
					<span className="mega-menu-service-title">{child.label}</span>
					<span className="mega-menu-service-nav">
						<i className="tji-arrow-right-long"></i>
						<i className="tji-arrow-right-long"></i>
					</span>
				</Link>
			</li>
		))}
	</ul>
);

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
							{item.children && item.mega ? <MegaMenu items={item.children} /> : null}
							{item.children && !item.mega ? (
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
