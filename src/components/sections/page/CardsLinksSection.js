import Link from "next/link";
import { delay } from "./animation";
import SectionHeading from "./SectionHeading";

const CardsLinksSection = ({ anchor, eyebrow, heading, intro, items }) => {
	const colClass = items.length === 4 ? "col-lg-3 col-md-6" : "col-lg-4 col-md-6";
	return (
		<section id={anchor} className="tj-page-section section-gap-2">
			<div className="container">
				<SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} />
				<div className="row row-gap-4">
					{items.map((item, idx) => (
						<div className={`${colClass} wow fadeInUp`} data-wow-delay={delay(idx)} key={`${idx}-${item.href}`}>
							<Link className="page-link-card" href={item.href}>
								{item.image ? <img src={item.image} alt="" loading="lazy" /> : null}
								<div className="page-link-card-body">
									<h3 className="title page-item-title">{item.title}</h3>
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
};
export default CardsLinksSection;
