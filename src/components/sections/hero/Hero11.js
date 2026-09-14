import ButtonPrimary from "@/components/shared/buttons/ButtonPrimary";
import Image from "next/image";

const Hero11 = () => {
	return (
		<section className="tj-banner-section-2 h11-banner-section">
			<div className="container">
				<div className="row align-items-center">
					<div className="col-lg-8">
						<div className="banner-content-2">
							<span className="sub-title wow fadeInUp" data-wow-delay=".2s">
								<i className="tji-box"></i> Renowned Growth company
							</span>
							<h1 className="banner-title title-anim">
								Leading Future for Corporate Business.
							</h1>
							<div className="desc wow fadeInUp" data-wow-delay=".5s">
								Committed to delivering innovative solutions that Committed to
								delivering innovative solutions.
							</div>
							<div className="btn-area wow fadeInUp" data-wow-delay=".8s">
								<ButtonPrimary text={"Get Started"} url={"/contact"} />
								<div className="customers">
									<ul>
										<li className="wow fadeInLeft" data-wow-delay=".5s">
											<Image
												width={89}
												height={89}
												src="/images/testimonial/client-1.webp"
												alt=""
											/>
										</li>
										<li className="wow fadeInLeft" data-wow-delay=".6s">
											<Image
												width={89}
												height={89}
												src="/images/testimonial/client-2.webp"
												alt=""
											/>
										</li>
										<li className="wow fadeInLeft" data-wow-delay=".7s">
											<Image
												width={89}
												height={89}
												src="/images/testimonial/client-3.webp"
												alt=""
											/>
										</li>
										<li className="wow fadeInLeft" data-wow-delay=".8s">
											<span>
												<i className="tji-plus"></i>
											</span>
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="h11-banner-img wow fadeInRight" data-wow-delay=".3s">
				<Image
					width={1390}
					height={1363}
					src="/images/hero/h11-hero-img.webp"
					alt=""
				/>
			</div>
			<div className="h11-shape-1">
				<Image
					width={510}
					height={365}
					style={{ height: "auto" }}
					src="/images/shape/h11-hero-blur.png"
					alt=""
				/>
			</div>
			<div className="h11-shape-2 wow fadeInLeft" data-wow-delay=".3s">
				<Image
					width={143}
					height={379}
					style={{ height: "auto" }}
					src="/images/shape/h11-shape-2.svg"
					alt=""
				/>
			</div>
		</section>
	);
};

export default Hero11;
