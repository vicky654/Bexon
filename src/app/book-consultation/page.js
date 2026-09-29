import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";
import LeadFormSection from "@/components/sections/contacts/LeadFormSection";
import Cta from "@/components/sections/cta/Cta";
import HeroInner from "@/components/sections/hero/HeroInner";
import BackToTop from "@/components/shared/others/BackToTop";
import HeaderSpace from "@/components/shared/others/HeaderSpace";
import ClientWrapper from "@/components/shared/wrappers/ClientWrapper";

export const metadata = {
	title: "Book a DPDP Compliance Consultation | DPDP Consultants",
	description: "Schedule a call with DPDP Consultants to discuss your organization's DPDP compliance needs.",
};

export default function BookConsultation() {
	return (
		<div>
			<BackToTop />
			<Header />
			<Header isStickyHeader={true} />
			<div id="smooth-wrapper">
				<div id="smooth-content">
					<main>
						<HeaderSpace />
						<HeroInner title={"Book a Consultation"} text={"Book a Consultation"} />
						<LeadFormSection
							type="consultation"
							eyebrow="Consultation"
							title="Book a DPDP Compliance Consultation"
							intro="Schedule a call with DPDP Consultants to discuss your organization's DPDP compliance needs. Our experts will guide you through requirements, clarify obligations, and help you plan a clear path to achieving and maintaining data protection compliance."
							points={["Gap assessment and remediation planning", "Live demonstrations of compliance tools", "Data Protection Officer as a Service"]}
						/>
						<Cta />
					</main>
					<Footer />
				</div>
			</div>
			<ClientWrapper />
		</div>
	);
}
