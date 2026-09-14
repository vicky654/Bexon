import modifyNumber from "@/libs/modifyNumber";
import Image from "next/image";

const ServiceCard12 = ({ service, idx, lastItem }) => {
	const { title, desc, id, totalProject, img6, svg, iconName } = service || {};

	return (
		<div className="h6-service-item h11-service-item">
			<div className="h6-service-thumb">
				<a href={`/services/${id}`}>
					<Image
						width={630}
						height={677}
						src={img6 ? img6 : "/images/service/h11-service-1.webp"}
						alt=""
					/>
				</a>
			</div>
			<div className="h6-service-content">
				<h5 className="h6-service-index">{modifyNumber(idx + 1)}.</h5>
				<div className="h6-service-title-wrap">
					<h4 className="title">
						<a href={`/services/${id}`}>{title}</a>
					</h4>
					<a className="text-btn" href={`/services/${id}`}>
						<span className="btn-icon">
							<i className="tji-arrow-right-long"></i>
						</span>
					</a>
				</div>
			</div>
		</div>
	);
};

export default ServiceCard12;
