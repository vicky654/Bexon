import ButtonPrimary from "@/components/shared/buttons/ButtonPrimary";

const CtaSection = ({ heading, text, primary, secondary }) => (
	<section className="tj-page-section section-gap-2">
		<div className="container">
			<div className="page-cta">
				<div className="page-cta-content">
					<h2 className="page-cta-title">{heading}</h2>
					<p className="page-cta-text">{text}</p>
				</div>
				<div className="page-cta-actions">
					<ButtonPrimary text={primary.label} url={primary.href} />
					{secondary ? <ButtonPrimary text={secondary.label} url={secondary.href} isTextBtn={true} /> : null}
				</div>
			</div>
		</div>
	</section>
);
export default CtaSection;
