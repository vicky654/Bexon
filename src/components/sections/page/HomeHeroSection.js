import ButtonPrimary from "@/components/shared/buttons/ButtonPrimary";

// Home hero: title reveals word by word, text and buttons fade up, the image
// slides in, and two soft background shapes drift (template moveVarBig
// keyframes).
const HomeHeroSection = ({ anchor, eyebrow, title, text, primary, secondary, image }) => (
	<section id={anchor} className="page-home-hero section-gap-x">
		<div className="page-home-hero-shapes" aria-hidden="true">
			<img className="page-home-hero-shape shape-1" src="/images/shape/shape-blur.svg" alt="" />
			<img className="page-home-hero-shape shape-2" src="/images/shape/pattern-3.svg" alt="" />
		</div>
		<div className="container">
			<div className="row align-items-center row-gap-5">
				<div className={image ? "col-lg-6" : "col-lg-9"}>
					{eyebrow ? (
						<span className="sub-title wow fadeInUp" data-wow-delay=".1s">
							<i className="tji-box"></i>
							{eyebrow}
						</span>
					) : null}
					<h1 className="page-home-hero-title title-anim">{title}</h1>
					<p className="page-home-hero-text wow fadeInUp" data-wow-delay=".4s">
						{text}
					</p>
					<div className="page-home-hero-actions wow fadeInUp" data-wow-delay=".6s">
						<ButtonPrimary text={primary.label} url={primary.href} />
						{secondary ? <ButtonPrimary text={secondary.label} url={secondary.href} isTextBtn={true} /> : null}
					</div>
				</div>
				{image ? (
					<div className="col-lg-6">
						<div className="wow fadeInRight" data-wow-delay=".4s">
							<img className="page-home-hero-image" src={image} alt="" />
						</div>
					</div>
				) : null}
			</div>
		</div>
	</section>
);
export default HomeHeroSection;
