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
import { RESOURCE_TYPE_LABELS } from "@/libs/contentFormat";

export async function generateMetadata({ params }) {
	const { slug } = await params;
	const item = await getContentItem("resource", slug);
	if (!item) return { title: "Resources | DPDP Consultants" };
	return {
		title: `${item.title} | DPDP Consultants`,
		description: item.summary,
		openGraph: item.coverImage ? { images: [item.coverImage] } : undefined,
	};
}

const DOWNLOAD_NOTICES = {
	expired: {
		gated: "Your download link has expired. Fill in the form again to get a fresh link.",
		ungated: "Please try the download again.",
	},
	unavailable: "This file isn't available right now. Please try again later or email info@dpdpconsultants.com.",
};

export default async function ResourceDetails({ params, searchParams }) {
	const { slug } = await params;
	const { download } = await searchParams;
	const item = await getContentItem("resource", slug);

	if (!item) {
		notFound();
	}

	const meta = [
		RESOURCE_TYPE_LABELS[item.resourceType],
		item.gated ? "Free download · form required" : "Free download",
	]
		.filter(Boolean)
		.join(" · ");

	let notice = null;
	if (download === "expired") {
		notice = item.gated ? DOWNLOAD_NOTICES.expired.gated : DOWNLOAD_NOTICES.expired.ungated;
	} else if (download === "unavailable") {
		notice = DOWNLOAD_NOTICES.unavailable;
	}

	let aside;
	if (item.gated) {
		aside = (
			<ContentLeadForm
				type="resource"
				contentId={item.id}
				title="Get this resource"
				intro="Fill in your details and the download will start straight away."
			/>
		);
	} else if (item.hasFile) {
		aside = (
			<div className="content-side-card">
				<h3 className="title">Download</h3>
				<a className="text-btn" href={`/api/content/resource/${item.slug}/download`} download>
					<span className="btn-text"><span>Download</span></span>
					<span className="btn-icon"><i className="tji-arrow-right-long"></i></span>
				</a>
			</div>
		);
	} else {
		aside = (
			<div className="content-side-card">
				<p>This resource will be available soon.</p>
			</div>
		);
	}

	if (notice) {
		aside = (
			<>
				<div className="content-side-card content-side-notice">
					<p>{notice}</p>
				</div>
				{aside}
			</>
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
						<HeroInner title={"Resources"} text={item.title} breadcrums={[{ name: "Resources", path: "/resources" }]} />
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
