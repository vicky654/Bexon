import ButtonPrimary from "@/components/shared/buttons/ButtonPrimary";
import HeroDashboard from "./HeroDashboard";

// Splits the title around `highlight` so that phrase can carry the brand
// gradient. The validator guarantees `highlight` occurs in `title`.
function titleParts(title, highlight) {
	const at = highlight ? title.indexOf(highlight) : -1;
	if (at === -1) return [title, null, ""];
	return [title.slice(0, at), highlight, title.slice(at + highlight.length)];
}

// Home hero: dark brand background with drifting colour glows and a faint
// grid, a word-by-word title reveal, trust badges, and an animated
// "compliance dashboard" illustration (or a plain image when one is given).
const HomeHeroSection = ({ anchor, eyebrow, title, highlight, text, primary, secondary, image, badges }) => {
	const [before, marked, after] = titleParts(title, highlight);
	return (
		<section id={anchor} className="page-home-hero">
			<div className="page-home-hero-bg" aria-hidden="true">
				<span className="page-home-hero-glow glow-1"></span>
				<span className="page-home-hero-glow glow-2"></span>
				<span className="page-home-hero-glow glow-3"></span>
				<span className="page-home-hero-grid"></span>
			</div>
			<div className="container">
				<div className="row align-items-center row-gap-5">
					<div className="col-lg-6">
						<span className="page-home-hero-eyebrow wow fadeInUp" data-wow-delay=".1s">
							<span className="dot"></span>
							{eyebrow || "DPDP Act 2023 compliance"}
						</span>
						<h1 className="page-home-hero-title">
							<span className="title-anim">{before}</span>
							{marked ? <span className="page-gradient-text">{marked}</span> : null}
							{after ? <span className="title-anim">{after}</span> : null}
						</h1>
						<p className="page-home-hero-text wow fadeInUp" data-wow-delay=".4s">
							{text}
						</p>
						<div className="page-home-hero-actions wow fadeInUp" data-wow-delay=".55s">
							<ButtonPrimary text={primary.label} url={primary.href} className="page-btn-glow" />
							{secondary ? <ButtonPrimary text={secondary.label} url={secondary.href} isTextBtn={true} className="page-btn-light" /> : null}
						</div>
						{badges?.length ? (
							<ul className="page-home-hero-badges wow fadeInUp" data-wow-delay=".7s">
								{badges.map(badge => (
									<li key={badge}>
										<i className="tji-check"></i>
										{badge}
									</li>
								))}
							</ul>
						) : null}
					</div>
					<div className="col-lg-6">
						<div className="wow fadeInRight" data-wow-delay=".4s">
							{image ? <img className="page-home-hero-image" src={image} alt="" /> : <HeroDashboard />}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
export default HomeHeroSection;
