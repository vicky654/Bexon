"use client";
import useActiveLink from "@/hooks/useActiveLink";
import { NAVIGATION } from "@/content/navigation";
import Link from "next/link";

// Two-column mega panel: gradient icon tile, title and one-line description
// per item, plus a dark feature card. The child that links back to the
// parent page ("All ...") becomes the feature card's button.
const MegaMenu = ({ item }) => {
	const items = item.children.filter(child => child.href !== item.href);
	const { feature } = item;
	return (
		<div className="sub-menu page-mega">
			<div className="page-mega-grid">
				{items.map(child => (
					<Link className="page-mega-item" href={child.href} key={child.href}>
						<span className="page-mega-icon">
							<i className={child.icon || "tji-service-1"}></i>
						</span>
						<span className="page-mega-text">
							<span className="page-mega-title">{child.label}</span>
							{child.desc ? <span className="page-mega-desc">{child.desc}</span> : null}
						</span>
						<i className="tji-arrow-right-long page-mega-arrow" aria-hidden="true"></i>
					</Link>
				))}
			</div>
			{feature ? (
				<div className="page-mega-feature">
					<span className="page-mega-feature-glow" aria-hidden="true"></span>
					<p className="page-mega-feature-title">{feature.title}</p>
					<p className="page-mega-feature-text">{feature.text}</p>
					<div className="page-mega-feature-actions">
						<Link className="page-mega-feature-btn" href={feature.primary.href}>
							{feature.primary.label}
							<i className="tji-arrow-right-long" aria-hidden="true"></i>
						</Link>
						{feature.secondary ? (
							<Link className="page-mega-feature-link" href={feature.secondary.href}>
								{feature.secondary.label}
							</Link>
						) : null}
					</div>
				</div>
			) : null}
		</div>
	);
};

const Dropdown = ({ items }) => (
	<ul className="sub-menu page-dropdown">
		{items.map(child => (
			<li key={child.href + child.label}>
				<Link href={child.href}>
					<span>{child.label}</span>
					<i className="tji-arrow-right-long" aria-hidden="true"></i>
				</Link>
			</li>
		))}
	</ul>
);

const Navbar = () => {
	const isActive = useActiveLink();
	return (
		<div className="menu-area d-none d-lg-inline-flex align-items-center">
			<nav id="mobile-menu" className="mainmenu page-mainmenu">
				<ul>
					{NAVIGATION.map(item => (
						<li
							key={item.label}
							className={`${item.children ? "has-dropdown" : ""} ${item.mega ? "has-mega" : ""} ${isActive(item) ? "current-menu-ancestor" : ""}`}
						>
							<Link href={item.href}>{item.label}</Link>
							{item.children && item.mega ? <MegaMenu item={item} /> : null}
							{item.children && !item.mega ? <Dropdown items={item.children} /> : null}
						</li>
					))}
				</ul>
			</nav>
		</div>
	);
};

export default Navbar;
