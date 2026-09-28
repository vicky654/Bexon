import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";
import ThankYouPrimary from "@/components/sections/contacts/ThankYouPrimary";
import HeroInner from "@/components/sections/hero/HeroInner";
import BackToTop from "@/components/shared/others/BackToTop";
import HeaderSpace from "@/components/shared/others/HeaderSpace";
import ClientWrapper from "@/components/shared/wrappers/ClientWrapper";

export const metadata = {
	title: "Thank You | DPDP Consultants",
	robots: { index: false },
};

export default function ThankYou() {
	return (
		<div>
			<BackToTop />
			<Header />
			<Header isStickyHeader={true} />
			<div id="smooth-wrapper">
				<div id="smooth-content">
					<main>
						<HeaderSpace />
						<HeroInner title={"Thank You"} text={"Thank You"} />
						<ThankYouPrimary />
					</main>
					<Footer />
				</div>
			</div>
			<ClientWrapper />
		</div>
	);
}
