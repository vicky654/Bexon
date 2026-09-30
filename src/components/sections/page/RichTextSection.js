// html comes from repo content files validated by src/content/validate.js.
const RichTextSection = ({ anchor, heading, html }) => (
	<section id={anchor} className="tj-page-section section-gap-2">
		<div className="container">
			<div className="row justify-content-center">
				<div className="col-lg-10 page-rich-card">
					{heading ? (
						<div className="sec-heading">
							<h2 className="sec-title title-anim">{heading}</h2>
						</div>
					) : null}
					<div
						className="page-rich-text wow fadeInUp"
						data-wow-delay=".3s"
						dangerouslySetInnerHTML={{ __html: html }}
					/>
				</div>
			</div>
		</div>
	</section>
);
export default RichTextSection;
