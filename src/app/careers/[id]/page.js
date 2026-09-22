import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";
import CareerDetails1 from "@/components/sections/careers/CareerDetails1";
import Cta from "@/components/sections/cta/Cta";
import HeroInner from "@/components/sections/hero/HeroInner";
import BackToTop from "@/components/shared/others/BackToTop";
import HeaderSpace from "@/components/shared/others/HeaderSpace";
import ClientWrapper from "@/components/shared/wrappers/ClientWrapper";
import { getJobFromBackendById, getJobsFromBackend } from "@/libs/careersApi";
import { notFound } from "next/navigation";

export default async function CareerDetails({ params }) {
	const { id } = await params;
	const job = await getJobFromBackendById(id);

	if (!job) {
		notFound();
	}

	const allJobs = await getJobsFromBackend();
	const currentIndex = allJobs.findIndex(item => item.id === job.id);
	const prevJob = currentIndex > 0 ? allJobs[currentIndex - 1] : null;
	const nextJob =
		currentIndex >= 0 && currentIndex < allJobs.length - 1 ? allJobs[currentIndex + 1] : null;

	return (
		<div>
			<BackToTop />
			<Header />
			<Header isStickyHeader={true} />
			<div id="smooth-wrapper">
				<div id="smooth-content">
					<main>
						<HeaderSpace />
						<HeroInner title={"Careers Details"} text={"Careers Details"} />
						<CareerDetails1 job={job} prevJob={prevJob} nextJob={nextJob} />
						<Cta />
					</main>
					<Footer />
				</div>
			</div>

			<ClientWrapper />
		</div>
	);
}
