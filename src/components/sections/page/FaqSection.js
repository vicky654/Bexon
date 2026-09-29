import SectionHeading from "./SectionHeading";

const FaqSection = ({ eyebrow, heading, items, idPrefix }) => (
	<section className="tj-faq-section section-gap-2">
		<div className="container">
			<SectionHeading eyebrow={eyebrow} heading={heading} />
			<div className="row justify-content-center">
				<div className="col-lg-10">
					<div className="accordion tj-faq" id={`${idPrefix}-faq`}>
						{items.map((item, idx) => {
							const id = `${idPrefix}-faq-${idx}`;
							return (
								<div className="accordion-item" key={id}>
									<button
										className={`faq-title ${idx === 0 ? "" : "collapsed"}`}
										type="button"
										data-bs-toggle="collapse"
										data-bs-target={`#${id}`}
										aria-expanded={idx === 0}
										aria-controls={id}
									>
										{item.question}
									</button>
									<div id={id} className={`collapse ${idx === 0 ? "show" : ""}`} data-bs-parent={`#${idPrefix}-faq`}>
										<div className="accordion-body faq-text" dangerouslySetInnerHTML={{ __html: item.answer }} />
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	</section>
);
export default FaqSection;
