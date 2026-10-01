// A strip of short phrases scrolling sideways forever (CSS animation). The
// list is rendered twice so the loop is seamless; the copy is hidden from
// screen readers so each phrase is announced once.
const MarqueeSection = ({ anchor, items }) => (
	<section id={anchor} className="page-marquee">
		<div className="page-marquee-track">
			{[0, 1].map(copy => (
				<ul className="page-marquee-list" aria-hidden={copy === 1 ? "true" : undefined} key={copy}>
					{items.map(item => (
						<li key={item}>
							<i className="tji-star" aria-hidden="true"></i>
							{item}
						</li>
					))}
				</ul>
			))}
		</div>
	</section>
);
export default MarqueeSection;
