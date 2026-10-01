import { SITE_NAME, SITE_URL } from "@/libs/seo";

// schema.org Organization data for search engines (company panel, logo,
// contact numbers, social profiles). Same details as the footer.
const ORGANIZATION = {
	"@context": "https://schema.org",
	"@type": "Organization",
	name: SITE_NAME,
	legalName: "Privacyium Tech Pvt. Ltd.",
	url: SITE_URL,
	logo: `${SITE_URL}/images/logos/DPDPLogo.png`,
	slogan: "Empowering Privacy in Digital World",
	email: "info@dpdpconsultants.com",
	address: {
		"@type": "PostalAddress",
		streetAddress: "GM IT Park, 4th Floor, Plot no 32-33, Sector 142",
		addressLocality: "Noida",
		addressRegion: "Uttar Pradesh",
		postalCode: "201305",
		addressCountry: "IN",
	},
	contactPoint: [
		{ "@type": "ContactPoint", telephone: "+91-120-6930999", contactType: "customer service", areaServed: "IN" },
		{ "@type": "ContactPoint", telephone: "+91-1800-5711333", contactType: "customer service", contactOption: "TollFree", areaServed: "IN" },
	],
	sameAs: [
		"https://www.linkedin.com/company/dpdpconsultants/",
		"https://www.facebook.com/profile.php?id=61561140562760",
		"https://www.instagram.com/dpdp.consultants/",
		"https://x.com/socialdpdp43979",
		"https://www.youtube.com/@DPDPConsultants",
		"https://www.quora.com/profile/DPDP-Consultants",
		"https://pin.it/1nhQ1Ugv0",
	],
};

const OrganizationJsonLd = () => (
	<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION) }} />
);
export default OrganizationJsonLd;
