import SectionHeading from "./SectionHeading";
import FaqAccordion from "./FaqAccordion";

const FaqSection = ({ eyebrow, heading, items, idPrefix }) => (
	<section className="tj-faq-section section-gap-2">
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
