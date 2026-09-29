export const NAVIGATION = [
	{ label: "Home", href: "/" },
	{
		label: "DPDP Act",
		href: "/dpdp-act",
		children: [
			{ label: "DPDP Act 2023", href: "/dpdp-act" },
			{ label: "DPDP Rules 2025", href: "/dpdp-act/dpdp-rules-2025" },
			{ label: "Penalties & Fines", href: "/dpdp-act/penalties-and-fines" },
			{ label: "Third-Party & Processor Obligations", href: "/dpdp-act/third-party-obligations" },
			{ label: "DPDPA & Business Continuity", href: "/dpdp-act/business-continuity" },
		],
	},
	{
		label: "Products",
		href: "/products",
		children: [
			{ label: "All Compliance Tools", href: "/products" },
			{ label: "Consent Management", href: "/products/consent-management" },
			{ label: "Rights & Grievance Redressal", href: "/products/grievance-redressal" },
			{ label: "Awareness Program", href: "/products/awareness-program" },
			{ label: "Impact Assessment", href: "/products/impact-assessment" },
			{ label: "Third-Party Risk Assessment", href: "/products/third-party-assessment" },
			{ label: "Cookie Consent", href: "/products/cookie-consent" },
		],
	},
	{
		label: "Services",
		href: "/services",
		children: [
			{ label: "All Services", href: "/services" },
			{ label: "Gap Assessment & Readiness Review", href: "/services/gap-assessment" },
			{ label: "DPO as a Service", href: "/services/dpo-as-a-service" },
			{ label: "Contract Review & DPAs", href: "/services/contract-review" },
			{ label: "Consulting, Advisory & Audit", href: "/services/consulting-advisory-audit" },
			{ label: "Training Programs", href: "/services/training-programs" },
			{ label: "DPDP Act Foundation Course", href: "/services/dpdp-act-foundation-course" },
		],
	},
	{
		label: "Resources",
		href: "/resources",
		children: [
			{ label: "Blogs", href: "/blogs" },
			{ label: "News", href: "/news" },
			{ label: "Webinars & Events", href: "/events" },
			{ label: "Whitepapers & Guides", href: "/resources" },
			{ label: "Case Studies", href: "/case-studies" },
		],
	},
	{
		label: "Company",
		href: "/about",
		children: [
			{ label: "About Us", href: "/about" },
			{ label: "Careers", href: "/careers" },
			{ label: "Partner With Us", href: "/partner-with-us" },
			{ label: "Contact Us", href: "/contact" },
		],
	},
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
			{ label: "News", href: "/news" },
			{ label: "Webinars & Events", href: "/events" },
			{ label: "Whitepapers & Guides", href: "/resources" },
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
