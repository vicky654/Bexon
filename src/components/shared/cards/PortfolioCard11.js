import modifyNumber from "@/libs/modifyNumber";
import Image from "next/image";
import Link from "next/link";

const PortfolioCard11 = ({ portfolio, idx }) => {
	const {
		title = "Event Management Platform",
		img8 = "/images/project/h10-project-1.webp",
		shortDesc,
		id,
		dataFilter,
		category = "Connect",
	} = portfolio ? portfolio : {};
	return (
		<div
			className="project-item h11-project-item wow fadeInUp"
			data-wow-delay="0.3s"
		>
			<div className="project-img">
				<Image width={645} height={460} src={img8} alt="" />
			</div>
			<div className="project-content">
				<div className="project-sl">{modifyNumber(idx + 1)}.</div>
				<div className="project-text">
					<span className="categories">
						<Link href={`/portfolios/${id}`}>{category}</Link>
					</span>
					<h3 className="title">
						<Link href={`/portfolios/${id}`}>{title}</Link>
					</h3>
				</div>
				<Link className="project-btn" href={`/portfolios/${id}`}>
					<i className="tji-arrow-right-big"></i>
					<i className="tji-arrow-right-long"></i>
				</Link>
			</div>
		</div>
	);
};

export default PortfolioCard11;
