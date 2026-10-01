import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";
import BlogMain from "@/components/layout/main/BlogMain";
import { Suspense } from "react";
import Cta from "@/components/sections/cta/Cta";
import BackToTop from "@/components/shared/others/BackToTop";
import HeaderSpace from "@/components/shared/others/HeaderSpace";
import ClientWrapper from "@/components/shared/wrappers/ClientWrapper";
import { pageMetadata } from "@/libs/seo";

// Title and description carried over from the old site's page.
export const metadata = pageMetadata({
	title: "Blogs updates on DPDP Act compliance | DPDP Consultants",
	description: "Explore articles on DPDP Act updates, privacy enforcement, best practices and guides to strengthen compliance.",
	path: "/blogs",
});

export default function Blogs() {
	return (
		<div>
			<BackToTop />
			<Header />
			<Header isStickyHeader={true} />
			<div id="smooth-wrapper">
				<div id="smooth-content">
					<main>
						<HeaderSpace />
						{/* BlogMain reads ?category / ?tag / ?search with useSearchParams. */}
						<Suspense fallback={null}>
							<BlogMain />
						</Suspense>
						<Cta />
					</main>
					<Footer />
				</div>
			</div>
			<ClientWrapper />
		</div>
	);
}
