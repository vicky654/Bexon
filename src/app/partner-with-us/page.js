import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";
import LeadFormSection from "@/components/sections/contacts/LeadFormSection";
import Cta from "@/components/sections/cta/Cta";
import HeroInner from "@/components/sections/hero/HeroInner";
import BackToTop from "@/components/shared/others/BackToTop";
import HeaderSpace from "@/components/shared/others/HeaderSpace";
import ClientWrapper from "@/components/shared/wrappers/ClientWrapper";

export const metadata = {
	title: "Partner With Us | DPDP Consultants",
	description: "Collaborate with DPDP Consultants on data protection compliance initiatives.",
};

export default function PartnerWithUs() {
	return (
		<div>
			<BackToTop />
			<Header />
			<Header isStickyHeader={true} />
			<div id="smooth-wrapper">
				<div id="smooth-content">
					<main>
						<HeaderSpace />
						<HeroInner title={"Partner With Us"} text={"Partner With Us"} />
						<LeadFormSection
							type="partner"
							title="Partner With DPDP Consultants for Data Protection Compliance"
							intro="Collaborate with DPDP Consultants on data protection compliance initiatives. Partner with us to help clients meet regulatory requirements, strengthen privacy frameworks, and ensure robust data protection practices."
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
