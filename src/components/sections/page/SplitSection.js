import { delay } from "./animation";
import PresenceMap from "./PresenceMap";
import SectionHeading from "./SectionHeading";
import StatCounter from "./StatCounter";

// Built-in illustrations a split section can show instead of an image.
const VISUALS = { "presence-map": PresenceMap };

// Text beside an image (or a built-in `visual`). With `stats`, the section
// becomes a highlighted band with count-up stat tiles under the text.
const SplitSection = ({ anchor, eyebrow, heading, html, image, imageAlt, reverse, stats, visual }) => {
	const Visual = VISUALS[visual];
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
						<div className={`${Visual ? "page-split-visual" : "page-split-media"} wow ${reverse ? "fadeInLeft" : "fadeInRight"}`} data-wow-delay=".3s">
							{Visual ? <Visual /> : <img className="page-split-image" src={image} alt={imageAlt} loading="lazy" />}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
export default SplitSection;
