import Link from "next/link";
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
import { RESOURCE_TYPE_FILTERS, RESOURCE_TYPE_LABELS, pageFrom } from "@/libs/contentFormat";

export const metadata = {
	title: "Resources | DPDP Consultants",
	description: "Whitepapers, guides, checklists and reports from DPDP Consultants.",
};

export default async function Resources({ searchParams }) {
	const params = await searchParams;
	const type = RESOURCE_TYPE_FILTERS.some(f => f.value === params?.type) ? params.type : "";
	const page = pageFrom(params?.page);
	const { items, total, pageSize } = await getContentList({ kind: "resource", page, resourceType: type });

	const cards = items.map(item => ({
		key: item.slug,
		node: (
			<ContentCard
				href={`/resources/${item.slug}`}
				image={item.coverImage}
				eyebrow={RESOURCE_TYPE_LABELS[item.resourceType]}
				title={item.title}
				summary={item.summary}
				meta={item.gated ? "Free download · form required" : "Free download"}
			/>
		),
	}));

	const buildHref = n => {
		const qs = new URLSearchParams();
		if (type) qs.set("type", type);
		if (n > 1) qs.set("page", String(n));
		const s = qs.toString();
		return s ? `/resources?${s}` : "/resources";
	};

	const filters = (
		<>
			{RESOURCE_TYPE_FILTERS.map(f => (
				<Link
					key={f.value || "all"}
					href={f.value ? `/resources?type=${f.value}` : "/resources"}
					className={`content-filter${type === f.value ? " active" : ""}`}
				>
					{f.label}
				</Link>
			))}
		</>
	);

	return (
		<div>
			<BackToTop />
			<Header />
			<Header isStickyHeader={true} />
			<div id="smooth-wrapper">
				<div id="smooth-content">
					<main>
						<HeaderSpace />
						<HeroInner title={"Resources"} text={"Resources"} />
						<ContentListing
							cards={cards}
							total={total}
							page={page}
							pageSize={pageSize}
							buildHref={buildHref}
							filters={filters}
							emptyText="No resources yet. Check back soon."
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
