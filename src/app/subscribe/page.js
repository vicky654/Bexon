import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";
import LeadFormSection from "@/components/sections/contacts/LeadFormSection";
import Cta from "@/components/sections/cta/Cta";
import HeroInner from "@/components/sections/hero/HeroInner";
import BackToTop from "@/components/shared/others/BackToTop";
import HeaderSpace from "@/components/shared/others/HeaderSpace";
import ClientWrapper from "@/components/shared/wrappers/ClientWrapper";
import { pageMetadata } from "@/libs/seo";

// Title and description carried over from the old site's newsletter page.
export const metadata = pageMetadata({
	title: "DPDP Act Newsletter | Latest Privacy News & Updates on data privacy",
	description: "Subscribe to our newsletter for regular updates on DPDP Act compliance, industry trends, and expert insights to keep your business informed.",
	path: "/subscribe",
});

export default function Subscribe() {
	return (
		<div>
			<BackToTop />
			<Header />
			<Header isStickyHeader={true} />
			<div id="smooth-wrapper">
				<div id="smooth-content">
					<main>
						<HeaderSpace />
						<HeroInner title={"Newsletter"} text={"Newsletter"} />
						<LeadFormSection
							type="newsletter"
							eyebrow="Newsletter"
							title="Subscribe to Our Newsletter"
							intro="Stay informed on the DPDP Act, rules, enforcement updates and practical privacy guidance, delivered to your inbox."
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
