import Link from "next/link";

const ContentCard = ({ href, image, eyebrow, title, summary, meta }) => (
	<div className="blog-item content-card">
		<div className="blog-thumb">
			<Link href={href}>
				<img src={image || "/images/blog/blog-1.webp"} alt="" loading="lazy" />
			</Link>
		</div>
		<div className="blog-content">
			<div className="blog-meta">
				{eyebrow ? <span className="categories">{eyebrow}</span> : null}
				{meta ? <span>{meta}</span> : null}
			</div>
			<h4 className="title">
				<Link href={href}>{title}</Link>
			</h4>
			{summary ? <p className="content-card-summary">{summary}</p> : null}
			<Link className="text-btn" href={href}>
				<span className="btn-text"><span>Read More</span></span>
				<span className="btn-icon"><i className="tji-arrow-right-long"></i></span>
			</Link>
		</div>
	</div>
);

export default ContentCard;
