const SectionHeading = ({ eyebrow, heading, intro, center = true }) => (
	<div className={`sec-heading ${center ? "text-center" : ""}`}>
		{eyebrow ? (
			<span className="sub-title">
				<i className="tji-box"></i>
				{eyebrow}
			</span>
		) : null}
		<h2 className="sec-title">{heading}</h2>
		{intro ? <p className="page-section-intro">{intro}</p> : null}
	</div>
);
export default SectionHeading;
