import ButtonPrimary from "@/components/shared/buttons/ButtonPrimary";
import PortfolioCard11 from "@/components/shared/cards/PortfolioCard11";
import getPortfolio from "@/libs/getPortfolio";
const Portfolios11 = () => {
	const portfolio = getPortfolio()?.slice(0, 4);
	return (
		<section className="h11-project section-gap">
			<div className="container">
				<div className="row">
					<div className="col-12">
						<div className="heading-wrap-content">
							<div className="sec-heading style-2 style-7">
								<span className="sub-title wow fadeInUp" data-wow-delay=".3s">
									<i className="tji-box"></i>Proud Projects
								</span>
								<h2 className="sec-title title-anim">
									Breaking Boundaries, Building Dreams.
								</h2>
							</div>
							<div
								className="btn-area d-lg-block d-none wow fadeInUp"
								data-wow-delay=".8s"
							>
								<ButtonPrimary text={"More Projects"} url={"/portfolios"} />
							</div>
						</div>

						<div className="h11-project-wrapper">
							{portfolio?.length
								? portfolio?.map((portfolioSingle, idx) => (
										<PortfolioCard11
											key={idx}
											portfolio={portfolioSingle}
											idx={idx}
										/>
									))
								: ""}
						</div>
						<div
							className="btn-area d-lg-none d-block text-center mt-40 wow fadeInUp"
							data-wow-delay=".8s"
						>
							<ButtonPrimary text={"More Projects"} url={"/portfolios"} />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Portfolios11;
