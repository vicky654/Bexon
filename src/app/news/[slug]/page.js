import { notFound } from "next/navigation";
import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";
import ContentDetail from "@/components/sections/content/ContentDetail";
import Cta from "@/components/sections/cta/Cta";
import HeroInner from "@/components/sections/hero/HeroInner";
import BackToTop from "@/components/shared/others/BackToTop";
import HeaderSpace from "@/components/shared/others/HeaderSpace";
import ClientWrapper from "@/components/shared/wrappers/ClientWrapper";
import { getContentItem } from "@/libs/contentApi";
import { formatDate } from "@/libs/contentFormat";
import { pageMetadata } from "@/libs/seo";
import JsonLd from "@/components/shared/others/JsonLd";
import { article } from "@/libs/structuredData";

export async function generateMetadata({ params }) {
	const { slug } = await params;
	const item = await getContentItem("news", slug);
	if (!item) return { title: "News | DPDP Consultants" };
	return pageMetadata({
		title: `${item.title} | DPDP Consultants`,
		description: item.summary,
		path: `/news/${slug}`,
		image: item.coverImage || undefined,
	});
}

export default async function NewsDetails({ params }) {
	const { slug } = await params;
	const item = await getContentItem("news", slug);

	if (!item) {
		notFound();
	}

	return (
		<div>
			<JsonLd
				data={article({
					type: "NewsArticle",
					title: item.title,
					description: item.summary,
					path: `/news/${slug}`,
					image: item.coverImage,
					publishedAt: item.publishedAt,
					updatedAt: item.updatedAt,
				})}
			/>
			<BackToTop />
			<Header />
			<Header isStickyHeader={true} />
			<div id="smooth-wrapper">
				<div id="smooth-content">
					<main>
						<HeaderSpace />
						<HeroInner titleAs="p" title={"News"} text={item.title} breadcrums={[{ name: "News", path: "/news" }]} />
						<ContentDetail item={item} meta={formatDate(item.publishedAt)} />
						{item.sourceUrl ? (
							<div className="container content-detail-footer">
								<a className="text-btn" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
									<span className="btn-text"><span>Read the original</span></span>
									<span className="btn-icon"><i className="tji-arrow-right-long"></i></span>
								</a>
							</div>
						) : null}
						<Cta />
					</main>
					<Footer />
				</div>
			</div>
			<ClientWrapper />
		</div>
	);
}
