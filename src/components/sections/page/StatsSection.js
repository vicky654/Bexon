const StatsSection = ({ items }) => (
	<section className="tj-page-section section-gap-2">
		<div className="container">
			<div className="page-stats">
				{items.map((item, idx) => (
					<div className="page-stat" key={`${idx}-${item.label}`}>
						<span className="page-stat-value">{item.value}</span>
						<span className="page-stat-label">{item.label}</span>
					</div>
				))}
			</div>
		</div>
	</section>
);
export default StatsSection;
