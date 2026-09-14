import Link from "next/link";

const FeatureCard = ({ feature, type, idx }) => {
	const { icon, title, desc, url } = feature ? feature : {};
	return (
		<div
			className={`choose-box ${type === 3 ? "h6-choose-box h7-choose-box" : type === 2 ? "h6-choose-box" : ""} right-swipe`}
		>
			<div className="choose-content">
				<div className="choose-icon">
					<i className={icon}></i>
				</div>
				<h4 className="title">{title}</h4>
				<p className="desc">{desc}</p>
				{url ? (
					<Link className="text-btn" href={url}>
						<span className="btn-text">
							<span>Read More</span>
						</span>
						<span className="btn-icon">
							<i className="tji-arrow-right-long"></i>
						</span>
					</Link>
				) : (
					""
				)}
			</div>
		</div>
	);
};

export default FeatureCard;
