import makePath from "@/libs/makePath";
import modifyNumber from "@/libs/modifyNumber";
import Link from "next/link";

const BlogCard8 = ({ blog, idx }) => {
	const {
		title,
		desc,
		slug,
		img = "/images/blog/blog-1.webp",
		category,
		date,
		day,
		month,
	} = blog || {};
	return (
		<div className="blog-item style-2 wow fadeInUp" data-wow-delay=".3s">
			<div className="blog-thumb">
				<Link href={`/blogs/${slug}`}>
					<img src={img} alt="" />
				</Link>
				<div className="blog-date">
					<span className="date">{modifyNumber(day)}</span>
					<span className="month">{month}</span>
				</div>
			</div>
			<div className="blog-content">
				<div className="title-area">
					<div className="blog-meta">
						<span className="categories">
							<Link href={`/blogs?category=${makePath(category)}`}>
								{category}
							</Link>
						</span>
						<span>
							By <Link href={`/blogs/${slug}`}>Ellinien Loma</Link>
						</span>
					</div>
					<h3 className="title">
						<Link href={`/blogs/${slug}`}>{title}.</Link>
					</h3>
				</div>
				<Link className="text-btn" href={`/blogs/${slug}`}>
					<span className="btn-icon">
						<i className="tji-arrow-right-long"></i>
					</span>
					<span className="btn-text">
						<span>Read More</span>
					</span>
				</Link>
			</div>
		</div>
	);
};

export default BlogCard8;
