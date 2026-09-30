// Menu tree mirrors every option the old website offered, grouped the same
// way (About Us, DPDP Act 2023, Compliance Tools, Services, Resources,
// Career). `mega: true` renders the template's icon mega menu.
export const NAVIGATION = [
	{ label: "Home", href: "/" },
	{
		label: "About Us",
		href: "/about",
		children: [
			{ label: "Who We Are", href: "/about#who-we-are" },
			{ label: "Mission & Vision", href: "/about#mission-vision" },
			{ label: "Our Team", href: "/about#our-team" },
			{ label: "What We Do", href: "/about#what-we-do" },
			{ label: "Awards & Certifications", href: "/about#awards" },
		],
	},
	{
		label: "DPDP Act 2023",
		href: "/dpdp-act",
		children: [
			{ label: "DPDP Act 2023", href: "/dpdp-act" },
			{ label: "Draft DPDP Rules 2025", href: "/dpdp-act/dpdp-rules-2025" },
			{ label: "Administrative Fines & Penalties", href: "/dpdp-act/penalties-and-fines" },
			{ label: "Subcontractor & Third-Party Issues", href: "/dpdp-act/third-party-obligations" },
			{ label: "DPDPA & Business Discontinuity", href: "/dpdp-act/business-continuity" },
			{ label: "Case Study", href: "/case-studies" },
		],
	},
	{
		label: "Compliance Tools",
		href: "/products",
		mega: true,
		children: [
			{ label: "Consent Management", href: "/products/consent-management", icon: "tji-check" },
			{ label: "Grievance Redressal", href: "/products/grievance-redressal", icon: "tji-support" },
			{ label: "Awareness Program", href: "/products/awareness-program", icon: "tji-team" },
			{ label: "Impact Assessment", href: "/products/impact-assessment", icon: "tji-chart" },
			{ label: "Third-Party Assessment", href: "/products/third-party-assessment", icon: "tji-organize" },
			{ label: "Cookie Consent", href: "/products/cookie-consent", icon: "tji-window" },
			{ label: "All Compliance Tools", href: "/products", icon: "tji-box" },
		],
	},
	{
		label: "Services",
		href: "/services",
		mega: true,
		children: [
			{ label: "Gap Assessment Review", href: "/services/gap-assessment", icon: "tji-search" },
			{ label: "DPO as a Service", href: "/services/dpo-as-a-service", icon: "tji-user" },
			{ label: "Contract Review & DPAs", href: "/services/contract-review", icon: "tji-list" },
			{ label: "Consulting, Advisory & Audit", href: "/services/consulting-advisory-audit", icon: "tji-strategy" },
			{ label: "Training Programs", href: "/services/training-programs", icon: "tji-growth" },
			{ label: "All Services", href: "/services", icon: "tji-service-1" },
		],
	},
	{
		label: "Resources",
		href: "/resources",
		children: [
			{ label: "Blogs", href: "/blogs" },
			{ label: "Whitepapers", href: "/resources?type=whitepaper" },
			{ label: "Newsletters", href: "/subscribe" },
			{ label: "Research Reports", href: "/resources?type=report" },
			{ label: "In the News", href: "/news" },
			{ label: "Webinars", href: "/events?when=past" },
			{ label: "Upcoming Events", href: "/events" },
		],
	},
	{
		label: "Career",
		href: "/careers",
		children: [
			{ label: "Join Our Team", href: "/careers" },
			{ label: "DPDP Act Foundation Course", href: "/services/dpdp-act-foundation-course" },
			{ label: "Partner With Us", href: "/partner-with-us" },
		],
	},
	{ label: "Contact Us", href: "/contact" },
];

export const FOOTER_LINKS = [
	{
		heading: "Company",
		links: [
			{ label: "About Us", href: "/about" },
			{ label: "Careers", href: "/careers" },
			{ label: "Partner With Us", href: "/partner-with-us" },
			{ label: "Contact Us", href: "/contact" },
		],
	},
	{
		heading: "Resources",
		links: [
			{ label: "Blogs", href: "/blogs" },
			{ label: "Whitepapers", href: "/resources?type=whitepaper" },
			{ label: "Research Reports", href: "/resources?type=report" },
			{ label: "In the News", href: "/news" },
			{ label: "Webinars & Events", href: "/events" },
		],
	},
	{
		heading: "Legal",
		links: [
			{ label: "FAQs", href: "/faq" },
			{ label: "Privacy Notice", href: "/privacy-notice" },
			{ label: "Terms & Conditions", href: "/terms-and-conditions" },
		],
	},
];
