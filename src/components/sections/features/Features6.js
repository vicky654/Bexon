import ButtonPrimary from "@/components/shared/buttons/ButtonPrimary";
import FeatureCard from "@/components/shared/cards/FeatureCard";

const Features6 = ({ type }) => {
	const features = [
		{
			title: "Innovative Solutions",
			desc: "We stay ahead of the curve, leveraging cutting-edge technologies and strategies to keep  you competitive in a marketplace.",
			icon: "tji-innovative",
			url: "/about",
		},
		{
			title: "Award-Winning Expertise",
			desc: "Recognized by industry leaders, our award-winning team has a proven record of delivering  excellence across projects.",
			icon: "tji-award",
			url: "/about",
		},
		{
			title: "Dedicated Support",
			desc: "Our team is always available to address your concerns, providing quick and effective solution to keep your business.",
			icon: "tji-support",
			url: "/about",
		},
	];

	return (
		<section id="choose" className="tj-choose-section h11-choose section-gap">
			<div className="container">
				<div className="row">
					<div className="col-12">
						{type === 2 ? (
							<div className="sec-heading-wrap">
								<span className="sub-title wow fadeInUp" data-wow-delay=".3s">
									<i className="tji-box"></i>Choose the Best
								</span>
								<div className="heading-wrap-content">
									<div className="sec-heading">
										<h2 className="sec-title title-anim">
											Empowering Business with <span>Expertise.</span>
										</h2>
									</div>
									<div className="btn-wrap wow fadeInUp" data-wow-delay=".6s">
										<ButtonPrimary text="Request a Call" url="/contact" />
									</div>
								</div>
							</div>
						) : (
							<div
								className={`sec-heading text-center ${type === 3 ? "style-2 style-7" : ""}`}
							>
								<span className="sub-title wow fadeInUp" data-wow-delay=".3s">
									<i className="tji-box"></i>Choose the Best
								</span>
								<h2 className="sec-title title-anim">
									Empowering Business with{" "}
									{type === 3 ? "Expertise." : <span>Expertise.</span>}
								</h2>
							</div>
						)}
					</div>
				</div>
				<div className="row row-gap-4 rightSwipeWrap">
					{features.map((feature, idx) => (
						<div key={idx} className="col-lg-4">
							<FeatureCard feature={feature} idx={idx} type={3} />
						</div>
					))}
				</div>
			</div>
		</section>
	);
};
export default Features6;
