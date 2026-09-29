import SectionHeading from "./SectionHeading";

const StepsSection = ({ eyebrow, heading, intro, items }) => (
	<section className="tj-page-section page-steps-section section-gap-2">
		<div className="container">
			<SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} />
			<ol className="page-steps">
				{items.map((item, idx) => (
					<li className="page-step" key={item.title}>
						<span className="page-step-number">{String(idx + 1).padStart(2, "0")}</span>
						<h4 className="page-step-title">{item.title}</h4>
						<p className="page-step-text">{item.text}</p>
					</li>
				))}
			</ol>
		</div>
	</section>
);
export default StepsSection;
