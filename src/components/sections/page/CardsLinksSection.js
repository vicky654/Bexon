import Link from "next/link";
import SectionHeading from "./SectionHeading";

const CardsLinksSection = ({ eyebrow, heading, intro, items }) => (
	<section className="tj-page-section section-gap-2">
		<div className="container">
			<SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} />
			<div className="row row-gap-4">
				{items.map((item, idx) => (
					<div className="col-lg-4 col-md-6" key={`${idx}-${item.href}`}>
						<Link className="page-link-card" href={item.href}>
							{item.image ? <img src={item.image} alt="" loading="lazy" /> : null}
							<div className="page-link-card-body">
								<h4 className="title">{item.title}</h4>
								<p>{item.text}</p>
								<span className="text-btn">
									<span className="btn-text"><span>Learn More</span></span>
									<span className="btn-icon"><i className="tji-arrow-right-long"></i></span>
								</span>
							</div>
						</Link>
					</div>
				))}
			</div>
		</div>
	</section>
);
export default CardsLinksSection;
