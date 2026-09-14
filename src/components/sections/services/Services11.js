import ServiceCard12 from "@/components/shared/cards/ServiceCard12";
import getALlServices from "@/libs/getALlServices";
import Image from "next/image";
const Services11 = () => {
	const services = getALlServices()?.slice(0, 3);
	return (
		<section className="h11-service section-gap section-gap-x">
			<div className="container">
				<div className="row">
					<div className="col-12">
						<div className="sec-heading sec-heading-centered style-2 style-7 ">
							<span className="sub-title wow fadeInUp" data-wow-delay=".3s">
								<i className="tji-box"></i>OUR SOLUTIONS
							</span>
							<h2 className="sec-title title-anim">
								Scalable business services
							</h2>
						</div>
					</div>
				</div>
				<div className="row row-gap-4">
					{services?.length
						? services?.map((service, idx) => (
								<div className="col-lg-4" key={idx}>
									<ServiceCard12 service={service} idx={idx} />
								</div>
							))
						: ""}
				</div>
			</div>
			<div className="bg-shape-1">
				<Image
					width={370}
					height={590}
					style={{ height: "auto" }}
					src="/images/shape/pattern-2.svg"
					alt=""
				/>
			</div>
			<div className="bg-shape-2">
				<Image
					width={370}
					height={590}
					style={{ height: "auto" }}
					src="/images/shape/pattern-3.svg"
					alt=""
				/>
			</div>
		</section>
	);
};

export default Services11;
