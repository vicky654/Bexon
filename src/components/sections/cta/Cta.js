import CtaSection from "@/components/sections/page/CtaSection";

// Site-wide closing call to action for listing and form pages, using the same
// gradient banner (and wording) as the home page.
const Cta = () => (
	<CtaSection
		heading="Turning Compliance into Competitive Advantage"
		text="Book a consultation to see how our consulting team and compliance tools can help your organisation meet DPDP Act requirements with confidence."
		primary={{ label: "Book a Consultation", href: "/book-consultation" }}
		secondary={{ label: "Contact Us", href: "/contact" }}
	/>
);

export default Cta;
