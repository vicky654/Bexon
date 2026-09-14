import makePath from "@/libs/makePath";
import Image from "next/image";
import Link from "next/link";

const BlogCard7 = ({ blog, idx }) => {
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
		<div className="blog-item wow fadeInUp" data-wow-delay=".3s">
			<div className="blog-thumb">
				<Link href={`/blogs/${slug}`}>
					<Image src={img} alt="Images" width={870} height={450} />
				</Link>
				<div className="blog-meta">
					<span className="categories">
						<Link href={`/blogs?category=${makePath(category)}`}>
							{category}
						</Link>
					</span>
				</div>
			</div>
			<div className="blog-content">
				<div className="blog-date">
					<p>June 20, 2025</p>
				</div>
				<div className="title-wrapper">
					<h4 className="title">
						<Link href={`/blogs/${slug}`}>{title}.</Link>
					</h4>
					<Link className="text-btn" href={`/blogs/${slug}`}>
						<span className="btn-icon">
							<i className="tji-arrow-right-long"></i>
						</span>
					</Link>
				</div>
			</div>
		</div>
	);
};

export default BlogCard7;
