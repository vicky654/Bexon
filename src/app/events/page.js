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
import { EVENT_FORMAT_LABELS, eventState, formatDateTime, pageFrom } from "@/libs/contentFormat";
import { pageMetadata } from "@/libs/seo";

// Upcoming events and past webinars were separate pages on the old site;
// each view keeps its old title and its own canonical URL.
export async function generateMetadata({ searchParams }) {
	const { when } = await searchParams;
	if (when === "past") {
		return pageMetadata({
			title: "DPDP Act Webinars & Live Sessions | DPDP Consultants",
			description: "Join expert webinars with demos, case studies & Q&A to learn practical DPDP Act compliance strategies.",
			path: "/events?when=past",
		});
	}
	return pageMetadata({
		title: "Register for upcoming DPDP Act 2023 events | DPDP Consultants",
		description: "Upcoming and past webinars and events hosted by DPDP Consultants.",
		path: "/events",
	});
}

export default async function Events({ searchParams }) {
	const params = await searchParams;
	const when = params?.when === "past" ? "past" : "";
	const page = pageFrom(params?.page);
	const { items, total, pageSize } = await getContentList({ kind: "event", page, when });

	const cards = items.map(item => ({
		key: item.slug,
		node: (
			<ContentCard
				href={`/events/${item.slug}`}
				image={item.coverImage}
				eyebrow={EVENT_FORMAT_LABELS[item.format]}
				title={item.title}
				summary={item.summary}
				meta={
					eventState(item) === "live"
						? `Happening now · ${formatDateTime(item.startsAt)}`
						: formatDateTime(item.startsAt)
				}
			/>
		),
	}));

	const buildHref = n => {
		const qs = new URLSearchParams();
		if (when) qs.set("when", when);
		if (n > 1) qs.set("page", String(n));
		const s = qs.toString();
		return s ? `/events?${s}` : "/events";
	};

	const filters = (
		<>
			<Link href="/events" className={`content-filter${when !== "past" ? " active" : ""}`}>
				Upcoming
			</Link>
			<Link href="/events?when=past" className={`content-filter${when === "past" ? " active" : ""}`}>
				Past
			</Link>
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
						<HeroInner title={"Webinars & Events"} text={"Webinars & Events"} />
						<ContentListing
							cards={cards}
							total={total}
							page={page}
							pageSize={pageSize}
							buildHref={buildHref}
							filters={filters}
							emptyText={when === "past" ? "No past events yet." : "No upcoming events right now."}
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
