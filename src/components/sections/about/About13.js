import ButtonPrimary from "@/components/shared/buttons/ButtonPrimary";
import FunfactSingle from "@/components/shared/funfact/FunfactSingle";
import PopupVideo from "@/components/shared/popup-video/PopupVideo";
import Image from "next/image";
import Link from "next/link";
const About13 = () => {
	return (
		<section className="h11-about-section section-gap">
			<div className="container">
				<div className="row">
					<div className="col-12">
						<div className="sec-heading style-2 style-7 h9-sec-heading h11-sec-heading">
							<span className="sub-title wow fadeInUp" data-wow-delay=".3s">
								<i className="tji-box"></i>About our company
							</span>
							<h2
								className="sec-title title-highlight wow fadeInUp"
								data-wow-delay=".3s"
							>
								Driven by Purpose, and Fueled by a Relentless Pursuit of Results
								and Client Real Success.
							</h2>
						</div>
						<div className="h9-about-area">
							<div
								className="about-img-area h6-about-img h11-about-img wow fadeInLeft"
								data-wow-delay=".3s"
							>
								<div className="about-img overflow-hidden">
									<Image
										width={449}
										height={470}
										data-speed=".8"
										src="/images/about/h9-about.webp"
										alt=""
									/>
								</div>
								<div className="box-area h6-about-box">
									<div
										className="customers-box wow fadeInUp"
										data-wow-delay="1s"
									>
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

										<h5
											className="customers-text wow fadeInUp"
											data-wow-delay=".5s"
										>
											We have 100+ happy customer.
										</h5>
									</div>
								</div>
							</div>
							<div className="h9-about-content h11-about-content">
								<div
									className="h11-about-funfact wow fadeInUp"
									data-wow-delay=".6s"
								>
									<div className="countup-item style-2">
										<span className="count-icon">
											<i className="tji-growth"></i>
										</span>
										<div className="count-inner">
											<FunfactSingle currentValue={20} symbol={"M"} />
											<span className="count-text">
												Reach Worldwide empower dreams everywhere.
											</span>
										</div>
									</div>
									<div className="countup-item style-2">
										<span className="count-icon">
											<i className="tji-complete"></i>
										</span>
										<div className="count-inner">
											<FunfactSingle currentValue={8.5} symbol={"X"} />
											<span className="count-text">
												Faster Growth starts smart solutions today.
											</span>
										</div>
									</div>
								</div>
								<p className="desc wow fadeInUp" data-wow-delay=".4s">
									Recognize that exceptional customer experiences are at the
									heart of every successful business. Our Customer Experience
									Solutions are crafted to help you transform every interaction.
								</p>
								<div
									className="about-btn-area-2 wow fadeInUp"
									data-wow-delay=".7s"
								>
									<ButtonPrimary text={"Know more us"} url={"/about"} />
									<PopupVideo>
										<Link
											className="video-btn video-popup glightbox"
											data-autoplay="true"
											data-vbtype="video"
											data-maxwidth="1200px"
											href="https://www.youtube.com/watch?v=MLpWrANjFbI"
										>
											<span className="play-btn">
												<i className="tji-play"></i>
											</span>
											<span className="video-text">Play our reels</span>
										</Link>
									</PopupVideo>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default About13;
