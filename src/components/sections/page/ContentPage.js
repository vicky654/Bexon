import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";
import HeroInner from "@/components/sections/hero/HeroInner";
import BackToTop from "@/components/shared/others/BackToTop";
import HeaderSpace from "@/components/shared/others/HeaderSpace";
import ClientWrapper from "@/components/shared/wrappers/ClientWrapper";
import { getPage } from "@/content/pages";
import HashScroller from "./HashScroller";
import PageRenderer from "./PageRenderer";

const ContentPage = ({ page }) => {
	const parent = page.parent ? getPage(page.parent) : null;
	return (
		<div>
			<BackToTop />
			<Header />
			<Header isStickyHeader={true} />
			<div id="smooth-wrapper">
				<div id="smooth-content">
					<main>
						<HeaderSpace />
						{page.hero ? (
							<HeroInner
								title={page.hero.title}
								text={page.label || page.hero.title}
								intro={page.hero.text}
								breadcrums={parent ? [{ name: parent.label || parent.title, path: parent.path }] : []}
							/>
						) : null}
						<PageRenderer sections={page.sections} />
					</main>
					<Footer />
				</div>
			</div>
			<ClientWrapper />
			<HashScroller />
		</div>
	);
};

export default ContentPage;
