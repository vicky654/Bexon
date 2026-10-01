import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";
import ContentCard from "@/components/sections/content/ContentCard";
import ContentListing from "@/components/sections/content/ContentListing";
import Cta from "@/components/sections/cta/Cta";
import HeroInner from "@/components/sections/hero/HeroInner";
import BackToTop from "@/components/shared/others/BackToTop";
import HeaderSpace from "@/components/shared/others/HeaderSpace";
import ClientWrapper from "@/components/shared/wrappers/ClientWrapper";
import { getContentList } from "@/libs/contentApi";
import { formatDate, pageFrom } from "@/libs/contentFormat";
import { pageMetadata } from "@/libs/seo";

export const metadata = pageMetadata({
	title: "News | DPDP Consultants",
	description: "Company news, announcements and DPDP Act updates from DPDP Consultants.",
	path: "/news",
});

export default async function News({ searchParams }) {
	const params = await searchParams;
	const page = pageFrom(params?.page);
	const { items, total, pageSize } = await getContentList({ kind: "news", page });

	const cards = items.map(item => ({
		key: item.slug,
		node: (
			<ContentCard
				href={`/news/${item.slug}`}
				image={item.coverImage}
				eyebrow="News"
				title={item.title}
				summary={item.summary}
				meta={formatDate(item.publishedAt)}
			/>
		),
	}));

	const buildHref = n => (n === 1 ? "/news" : `/news?page=${n}`);

	return (
		<div>
			<BackToTop />
			<Header />
			<Header isStickyHeader={true} />
			<div id="smooth-wrapper">
				<div id="smooth-content">
					<main>
						<HeaderSpace />
						<HeroInner title={"News"} text={"News"} />
						<ContentListing
							cards={cards}
							total={total}
							page={page}
							pageSize={pageSize}
							buildHref={buildHref}
							emptyText="No news yet. Check back soon."
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
