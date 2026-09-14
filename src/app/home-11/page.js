import Footer2 from "@/components/layout/footer/Footer2";
import Header from "@/components/layout/header/Header";
import About13 from "@/components/sections/about/About13";
import Blogs3 from "@/components/sections/blogs/Blogs3";
import Faq2 from "@/components/sections/faq/Faq2";
import Features6 from "@/components/sections/features/Features6";
import Hero11 from "@/components/sections/hero/Hero11";
import Portfolios11 from "@/components/sections/portfolios/Portfolios11";
import Services11 from "@/components/sections/services/Services11";
import Team1 from "@/components/sections/teams/Team1";
import Testimonials5 from "@/components/sections/testimonials/Testimonials5";
import BackToTop from "@/components/shared/others/BackToTop";
import TjMagicCursor from "@/components/shared/others/TjMagicCursor";
import ClientWrapper from "@/components/shared/wrappers/ClientWrapper";
export default function Home11() {
	return (
		<div>
			<BackToTop />
			<Header headerType={11} />
			<Header headerType={11} isStickyHeader={true} />
			<div id="smooth-wrapper">
				<div id="smooth-content">
					<main>
						<Hero11 />
						<Features6 type={3} />
						<About13 />
						<Services11 />
						<Portfolios11 />
						<Testimonials5 type={2} />
						<Team1 type={4} />
						<Blogs3 type={2} />
						<Faq2 type={4} />
					</main>
					<Footer2 />
				</div>
			</div>
			<TjMagicCursor />
			<ClientWrapper />
		</div>
	);
}
