import Link from "next/link";
import SectionHeading from "./SectionHeading";

const FeaturesSection = ({ eyebrow, heading, intro, items }) => (
	<section className="tj-choose-section section-gap-2">
		<div className="container">
			<SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} />
			<div className="row row-gap-4">
				{items.map(item => (
					<div className="col-lg-4 col-md-6" key={item.title}>
						<div className="choose-box page-feature">
							<div className="choose-content">
								<div className="choose-icon">
									<i className={item.icon || "tji-service-1"}></i>
								</div>
								<h4 className="title">{item.title}</h4>
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
