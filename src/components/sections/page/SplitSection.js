import SectionHeading from "./SectionHeading";

const SplitSection = ({ anchor, eyebrow, heading, html, image, imageAlt, reverse }) => (
	<section id={anchor} className="tj-page-section section-gap-2">
		<div className="container">
			<div className={`row align-items-center row-gap-5 ${reverse ? "flex-row-reverse" : ""}`}>
				<div className="col-lg-6">
					<SectionHeading eyebrow={eyebrow} heading={heading} center={false} />
					<div
						className="page-rich-text wow fadeInUp"
						data-wow-delay=".4s"
						dangerouslySetInnerHTML={{ __html: html }}
					/>
				</div>
				<div className="col-lg-6">
					<div className={`page-split-media wow ${reverse ? "fadeInLeft" : "fadeInRight"}`} data-wow-delay=".3s">
						<img className="page-split-image" src={image} alt={imageAlt} loading="lazy" />
					</div>
				</div>
			</div>
		</div>
	</section>
);
export default SplitSection;
