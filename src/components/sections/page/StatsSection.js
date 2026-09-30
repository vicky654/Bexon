import { delay } from "./animation";

const StatsSection = ({ anchor, items }) => (
	<section id={anchor} className="tj-page-section section-gap-2">
		<div className="container">
			<div className="page-stats">
				{items.map((item, idx) => (
					<div className="page-stat wow fadeInUp" data-wow-delay={delay(idx)} key={`${idx}-${item.label}`}>
						<span className="page-stat-value">{item.value}</span>
						<span className="page-stat-label">{item.label}</span>
					</div>
				))}
			</div>
		</div>
	</section>
);
export default StatsSection;
