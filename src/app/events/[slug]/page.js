import { notFound } from "next/navigation";
import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";
import ContentDetail from "@/components/sections/content/ContentDetail";
import ContentLeadForm from "@/components/sections/content/ContentLeadForm";
import Cta from "@/components/sections/cta/Cta";
import HeroInner from "@/components/sections/hero/HeroInner";
import BackToTop from "@/components/shared/others/BackToTop";
import HeaderSpace from "@/components/shared/others/HeaderSpace";
import ClientWrapper from "@/components/shared/wrappers/ClientWrapper";
import { getContentItem } from "@/libs/contentApi";
import { EVENT_FORMAT_LABELS, eventState, formatDateTime } from "@/libs/contentFormat";
import { pageMetadata } from "@/libs/seo";

export async function generateMetadata({ params }) {
	const { slug } = await params;
	const item = await getContentItem("event", slug);
	if (!item) return { title: "Webinars & Events | DPDP Consultants" };
	return pageMetadata({
		title: `${item.title} | DPDP Consultants`,
		description: item.summary,
		path: `/events/${slug}`,
		image: item.coverImage || undefined,
	});
}

export default async function EventDetails({ params }) {
	const { slug } = await params;
	const item = await getContentItem("event", slug);

	if (!item) {
		notFound();
	}

	const metaParts = [
		`${formatDateTime(item.startsAt)}${item.endsAt ? ` – ${formatDateTime(item.endsAt)}` : ""}`,
		EVENT_FORMAT_LABELS[item.format],
		item.venue,
	].filter(Boolean);
	const meta = metaParts.join(" · ");

	const state = eventState(item);

	let aside;
	if (state === "upcoming") {
		aside = <ContentLeadForm type="webinar" contentId={item.id} title="Register for this event" />;
	} else if (state === "live") {
		aside = (
			<div className="content-side-card">
				<h3 className="title">This event is in progress</h3>
				<p>Registration has closed.</p>
				{item.venue ? <p>Joining details: {item.venue}</p> : null}
			</div>
		);
	} else if (item.recordingUrl) {
		aside = (
			<div className="content-side-card">
				<h3 className="title">Recording available</h3>
				<a className="text-btn" href={item.recordingUrl} target="_blank" rel="noopener noreferrer">
					<span className="btn-text"><span>Watch the recording</span></span>
					<span className="btn-icon"><i className="tji-arrow-right-long"></i></span>
				</a>
			</div>
		);
	} else {
		aside = (
			<div className="content-side-card">
				<p>This event has ended.</p>
			</div>
		);
	}

	return (
		<div>
			<BackToTop />
			<Header />
			<Header isStickyHeader={true} />
			<div id="smooth-wrapper">
				<div id="smooth-content">
					<main>
						<HeaderSpace />
						<HeroInner title={"Webinars & Events"} text={item.title} breadcrums={[{ name: "Events", path: "/events" }]} />
						<ContentDetail item={item} meta={meta} aside={aside} />
						<Cta />
					</main>
					<Footer />
				</div>
			</div>
			<ClientWrapper />
		</div>
	);
}
