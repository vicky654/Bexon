import Link from "next/link";
import SectionHeading from "./SectionHeading";

// Cards use the template's `rightSwipeWrap` / `right-swipe` GSAP animation:
// they swing in from the right, one after another, when the row scrolls in.
const FeaturesSection = ({ anchor, eyebrow, heading, intro, items }) => (
	<section id={anchor} className="tj-choose-section section-gap-2">
		<div className="container">
			<SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} />
			<div className="row row-gap-4 rightSwipeWrap">
				{items.map((item, idx) => (
					<div className="col-lg-4 col-md-6" key={`${idx}-${item.title}`}>
						<div className="choose-box page-feature right-swipe">
							<div className="choose-content">
								<div className="choose-icon">
									<i className={item.icon || "tji-service-1"}></i>
								</div>
								<h3 className="title page-item-title">{item.title}</h3>
								<p className="desc">{item.text}</p>
								{item.href ? (
									<Link className="text-btn" href={item.href}>
										<span className="btn-text"><span>Learn More</span></span>
										<span className="btn-icon"><i className="tji-arrow-right-long"></i></span>
									</Link>
								) : null}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	</section>
);
export default FeaturesSection;
