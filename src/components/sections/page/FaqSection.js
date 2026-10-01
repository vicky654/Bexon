import SectionHeading from "./SectionHeading";
import FaqAccordion from "./FaqAccordion";
import JsonLd from "@/components/shared/others/JsonLd";
import { faqPage } from "@/libs/structuredData";

const FaqSection = ({ anchor, eyebrow, heading, items, idPrefix }) => (
	<section id={anchor} className="tj-faq-section section-gap-2">
		<JsonLd data={faqPage(items)} />
		<div className="container">
			<SectionHeading eyebrow={eyebrow} heading={heading} />
			<div className="row justify-content-center">
				<div className="col-lg-10">
					<FaqAccordion items={items} idPrefix={idPrefix} />
				</div>
			</div>
		</div>
	</section>
);
export default FaqSection;
