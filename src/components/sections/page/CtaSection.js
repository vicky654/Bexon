import ButtonPrimary from "@/components/shared/buttons/ButtonPrimary";

const CtaSection = ({ anchor, heading, text, primary, secondary }) => (
	<section id={anchor} className="tj-page-section section-gap-2">
		<div className="container">
			<div className="page-cta wow fadeInUp" data-wow-delay=".2s">
				<div className="page-cta-shape" aria-hidden="true">
					<img src="/images/shape/pattern-2.svg" alt="" />
				</div>
				<div className="page-cta-content">
					<h2 className="page-cta-title title-anim">{heading}</h2>
					<p className="page-cta-text wow fadeInUp" data-wow-delay=".4s">
						{text}
					</p>
				</div>
				<div className="page-cta-actions wow fadeInUp" data-wow-delay=".5s">
					<ButtonPrimary text={primary.label} url={primary.href} />
					{secondary ? <ButtonPrimary text={secondary.label} url={secondary.href} isTextBtn={true} /> : null}
				</div>
			</div>
		</div>
	</section>
);
export default CtaSection;
