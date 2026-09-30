// Template heading animations: eyebrow fades up, the title reveals word by
// word (`title-anim`, GSAP SplitText in ClientWrapper), intro fades up after.
const SectionHeading = ({ eyebrow, heading, intro, center = true }) => (
	<div className={`sec-heading ${center ? "text-center" : ""}`}>
		{eyebrow ? (
			<span className="sub-title wow fadeInUp" data-wow-delay=".2s">
				<i className="tji-box"></i>
				{eyebrow}
			</span>
		) : null}
		<h2 className="sec-title title-anim">{heading}</h2>
		{intro ? (
			<p className="page-section-intro wow fadeInUp" data-wow-delay=".4s">
				{intro}
			</p>
		) : null}
	</div>
);
export default SectionHeading;
