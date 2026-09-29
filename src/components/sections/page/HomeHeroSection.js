import ButtonPrimary from "@/components/shared/buttons/ButtonPrimary";

const HomeHeroSection = ({ eyebrow, title, text, primary, secondary, image }) => (
	<section className="page-home-hero section-gap-x">
		<div className="container">
			<div className="row align-items-center row-gap-5">
				<div className={image ? "col-lg-6" : "col-lg-9"}>
					{eyebrow ? (
						<span className="sub-title">
							<i className="tji-box"></i>
							{eyebrow}
						</span>
					) : null}
					<h1 className="page-home-hero-title">{title}</h1>
					<p className="page-home-hero-text">{text}</p>
					<div className="page-home-hero-actions">
						<ButtonPrimary text={primary.label} url={primary.href} />
						{secondary ? <ButtonPrimary text={secondary.label} url={secondary.href} isTextBtn={true} /> : null}
					</div>
				</div>
				{image ? (
					<div className="col-lg-6">
						<img className="page-home-hero-image" src={image} alt="" />
					</div>
				) : null}
			</div>
		</div>
	</section>
);
export default HomeHeroSection;
