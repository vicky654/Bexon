import { delay } from "./animation";
import SectionHeading from "./SectionHeading";
import StatCounter from "./StatCounter";

const StatsSection = ({ anchor, eyebrow, heading, intro, items }) => (
	<section id={anchor} className="tj-page-section section-gap-2">
		<div className="container">
			{heading ? <SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} /> : null}
			<div className="page-stats">
				{items.map((item, idx) => (
					<div className="page-stat wow fadeInUp" data-wow-delay={delay(idx)} key={`${idx}-${item.label}`}>
						<StatCounter value={item.value} />
						<span className="page-stat-label">{item.label}</span>
					</div>
				))}
			</div>
		</div>
	</section>
);
export default StatsSection;
