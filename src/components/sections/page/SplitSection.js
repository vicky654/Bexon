import { delay } from "./animation";
import SectionHeading from "./SectionHeading";
import StatCounter from "./StatCounter";

// Text beside an image. With `stats`, the section becomes a highlighted band:
// count-up stat tiles under the text and a floating, glowing image card.
const SplitSection = ({ anchor, eyebrow, heading, html, image, imageAlt, reverse, stats }) => {
	const hasStats = Boolean(stats?.length);
	return (
		<section id={anchor} className={`tj-page-section section-gap-2 page-split${hasStats ? " page-split-band" : ""}`}>
			{hasStats ? (
				<div className="page-split-band-bg" aria-hidden="true">
					<span className="page-split-band-glow glow-1"></span>
					<span className="page-split-band-glow glow-2"></span>
				</div>
			) : null}
			<div className="container">
				<div className={`row align-items-center row-gap-5 ${reverse ? "flex-row-reverse" : ""}`}>
					<div className="col-lg-6">
						<SectionHeading eyebrow={eyebrow} heading={heading} center={false} />
						<div
							className="page-rich-text page-split-body wow fadeInUp"
							data-wow-delay=".4s"
							dangerouslySetInnerHTML={{ __html: html }}
						/>
						{hasStats ? (
							<div className="page-split-stats">
								{stats.map((item, idx) => (
									<div className="page-split-stat wow fadeInUp" data-wow-delay={delay(idx, 0.4)} key={`${idx}-${item.label}`}>
										<StatCounter value={item.value} />
										<span className="page-stat-label">{item.label}</span>
									</div>
								))}
							</div>
						) : null}
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
};
export default SplitSection;
