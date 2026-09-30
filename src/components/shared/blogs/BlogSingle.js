"use client";
import makePath from "@/libs/makePath";
import makeWowDelay from "@/libs/makeWowDelay";
import modifyNumber from "@/libs/modifyNumber";
import coverImage from "@/libs/coverImage";
import Link from "next/link";
import ButtonPrimary from "../buttons/ButtonPrimary";

// Blog list card, shown from the post's own data only.
const BlogSingle = ({ blog, idx }) => {
	const { slug, img, title, desc, category, author, day, month } = blog || {};

	return (
		<article className="blog-item wow fadeInUp" data-wow-delay={makeWowDelay(idx, 0.1)}>
			<div className="blog-thumb">
				<Link href={`/blogs/${slug}`}>
					<img src={coverImage(img)} alt="" loading="lazy" />
				</Link>
				{day ? (
					<div className="blog-date">
						<span className="date">{modifyNumber(day)}</span>
						<span className="month">{month}</span>
					</div>
				) : null}
			</div>
			<div className="blog-content">
				{category || author ? (
					<div className="blog-meta">
						{category ? (
							<span className="categories">
								<Link href={`/blogs?category=${makePath(category)}`}>{category}</Link>
							</span>
						) : null}
						{author ? <span>By {author}</span> : null}
					</div>
				) : null}
				<h3 className="title">
					<Link href={`/blogs/${slug}`}>{title}</Link>
				</h3>
				{desc ? <p className="desc">{desc}</p> : null}
				<ButtonPrimary text={"Read More"} url={`/blogs/${slug}`} isTextBtn={true} />
			</div>
		</article>
	);
};

export default BlogSingle;
