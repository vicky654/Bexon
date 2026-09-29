// html comes from repo content files validated by src/content/validate.js.
const RichTextSection = ({ heading, html }) => (
	<section className="tj-page-section section-gap-2">
		<div className="container">
			<div className="row justify-content-center">
				<div className="col-lg-10">
					{heading ? (
						<div className="sec-heading">
							<h2 className="sec-title">{heading}</h2>
						</div>
					) : null}
					<div className="page-rich-text" dangerouslySetInnerHTML={{ __html: html }} />
				</div>
			</div>
		</div>
	</section>
);
export default RichTextSection;
