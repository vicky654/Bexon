"use client";
import useActiveLink from "@/hooks/useActiveLink";
import { NAVIGATION } from "@/content/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Phone / tablet navigation drawer in the site theme. Sections expand in
// place (one open at a time); mega-menu sections show icon tiles with their
// one-line descriptions. Closes on link tap, route change, Esc or backdrop.
const SOCIALS = [
	{ href: "https://www.linkedin.com/company/dpdpconsultants/", icon: "fa-linkedin-in", label: "LinkedIn" },
	{ href: "https://www.facebook.com/profile.php?id=61561140562760", icon: "fa-facebook-f", label: "Facebook" },
	{ href: "https://www.instagram.com/dpdp.consultants/", icon: "fa-instagram", label: "Instagram" },
	{ href: "https://x.com/socialdpdp43979", icon: "fa-x-twitter", label: "X" },
	{ href: "https://www.youtube.com/@DPDPConsultants", icon: "fa-youtube", label: "YouTube" },
];

const MobileMenu = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
	const isActive = useActiveLink();
	const pathname = usePathname();
	const [openSection, setOpenSection] = useState(null);
	const close = () => setIsMobileMenuOpen(false);

	// Close after navigating; reset expanded section.
	useEffect(() => {
		setIsMobileMenuOpen(false);
		setOpenSection(null);
	}, [pathname, setIsMobileMenuOpen]);

	// Esc to close and no page scroll behind the open drawer.
	useEffect(() => {
		if (!isMobileMenuOpen) return;
		const onKey = event => event.key === "Escape" && setIsMobileMenuOpen(false);
		document.addEventListener("keydown", onKey);
		const overflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = overflow;
		};
	}, [isMobileMenuOpen, setIsMobileMenuOpen]);

	return (
		<>
			<div className={`page-mnav-backdrop${isMobileMenuOpen ? " is-open" : ""}`} onClick={close} aria-hidden="true"></div>
			<aside
				className={`page-mnav d-lg-none${isMobileMenuOpen ? " is-open" : ""}`}
				aria-label="Site menu"
				aria-hidden={isMobileMenuOpen ? undefined : "true"}
				inert={isMobileMenuOpen ? undefined : true}
			>
				<span className="page-mnav-glow" aria-hidden="true"></span>
				<div className="page-mnav-top">
					<Link href="/" className="page-mnav-logo" onClick={close}>
						<img src="/images/logos/logo.webp" alt="DPDP Consultants" />
					</Link>
					<button type="button" className="page-mnav-close" onClick={close} aria-label="Close menu">
						<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
							<path d="M5 5l14 14M19 5L5 19" />
						</svg>
					</button>
				</div>

				<nav className="page-mnav-list">
					<ul>
						{NAVIGATION.map((item, idx) => {
							const active = isActive(item);
							if (!item.children) {
								return (
									<li key={item.label} style={{ "--i": idx }}>
										<Link href={item.href} className={`page-mnav-link${active ? " is-active" : ""}`} onClick={close}>
											{item.label}
										</Link>
									</li>
								);
							}
							const expanded = openSection === item.label;
							const panelId = `mnav-${idx}`;
							return (
								<li key={item.label} style={{ "--i": idx }} className={expanded ? "is-expanded" : ""}>
									<button
										type="button"
										className={`page-mnav-link page-mnav-toggle${active ? " is-active" : ""}`}
										aria-expanded={expanded}
										aria-controls={panelId}
										onClick={() => setOpenSection(expanded ? null : item.label)}
									>
										{item.label}
										<i className="tji-arrow-down" aria-hidden="true"></i>
									</button>
									<div className="page-mnav-panel" id={panelId}>
										<div className="page-mnav-panel-inner">
											<Link href={item.href} className="page-mnav-overview" onClick={close}>
												{item.mega ? `All ${item.label}` : `${item.label} overview`}
												<i className="tji-arrow-right-long" aria-hidden="true"></i>
											</Link>
											<ul className={item.mega ? "page-mnav-tiles" : "page-mnav-sub"}>
												{item.children
													.filter(child => child.href !== item.href)
													.map(child => (
														<li key={child.href + child.label}>
															<Link href={child.href} onClick={close}>
																{item.mega ? (
																	<span className="page-mnav-tile-icon">
																		<i className={child.icon || "tji-service-1"} aria-hidden="true"></i>
																	</span>
																) : null}
																<span className="page-mnav-sub-text">
																	<span>{child.label}</span>
																	{item.mega && child.desc ? <small>{child.desc}</small> : null}
																</span>
															</Link>
														</li>
													))}
											</ul>
										</div>
									</div>
								</li>
							);
						})}
					</ul>
				</nav>

				<div className="page-mnav-bottom">
					<Link href="/book-consultation" className="page-mnav-cta" onClick={close}>
						Book a Consultation
						<i className="tji-arrow-right-long" aria-hidden="true"></i>
					</Link>
					<div className="page-mnav-contact">
						<a href="tel:01206930999">
							<i className="tji-phone" aria-hidden="true"></i>0120-6930999
						</a>
						<a href="tel:18005711333">
							<i className="tji-phone" aria-hidden="true"></i>1800-5711333
						</a>
						<a href="mailto:info@dpdpconsultants.com">
							<i className="tji-envelop" aria-hidden="true"></i>info@dpdpconsultants.com
						</a>
					</div>
					<ul className="page-mnav-socials">
						{SOCIALS.map(social => (
							<li key={social.label}>
								<a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
									<i className={`fa-brands ${social.icon}`} aria-hidden="true"></i>
								</a>
							</li>
						))}
					</ul>
				</div>
			</aside>
		</>
	);
};

export default MobileMenu;
