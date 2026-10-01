import BlogSidebar from "@/components/shared/sidebar/BlogSidebar";
import BlogCover from "@/components/shared/blogs/BlogCover";
import makePath from "@/libs/makePath";
import Link from "next/link";

// A single blog post, rendered only from the post's own data (image, title,
// author, date, category, body, tags) plus previous/next navigation.
const BlogDetailsPrimary = ({ option }) => {
	const { prevSlug, nextSlug, currentItem, isPrevItem, isNextItem, posts } = option || {};
	const { title, img, imgAlt, tags, content, author, author_role, category, date } = currentItem || {};
	const isHtmlContent = content ? /<[a-z][\s\S]*>/i.test(content) : false;
	const contentParagraphs = !isHtmlContent
		? content
				?.split(/\n{2,}/)
				?.map(paragraph => paragraph.trim())
				?.filter(Boolean)
		: null;
	const meta = [
		author ? { icon: "tji-user", label: "Authored by", value: author_role ? `${author}, ${author_role}` : author } : null,
		date ? { icon: "tji-calendar", label: "Published", value: date } : null,
		category ? { icon: "tji-box", label: "Category", value: category } : null,
	].filter(Boolean);

	return (
		<section className="tj-blog-section section-gap slidebar-stickiy-container page-post">
			<div className="container">
				<div className="row row-gap-5">
					<div className="col-lg-8">
						<article className="post-details-wrapper">
							<div className="blog-images page-post-image wow fadeInUp" data-wow-delay=".1s">
								<BlogCover src={img} alt={imgAlt || ""} priority />
							</div>
							<h1 className="title title-anim">{title}</h1>
							{meta.length ? (
								<div className="blog-category-two page-post-meta wow fadeInUp" data-wow-delay=".3s">
									{meta.map(item => (
										<div className="category-item" key={item.label}>
											<div className="cate-icons">
												<i className={item.icon}></i>
											</div>
											<div className="cate-text">
												<span className="degination">{item.label}</span>
												<h6 className="text">{item.value}</h6>
											</div>
										</div>
									))}
								</div>
							) : null}
							<div className="blog-text">
								{isHtmlContent ? (
									<div className="wow fadeInUp" data-wow-delay=".3s" dangerouslySetInnerHTML={{ __html: content }} />
								) : (
									contentParagraphs?.map((paragraph, idx) => (
										<p key={idx} className="wow fadeInUp" data-wow-delay=".3s">
											{paragraph}
										</p>
									))
								)}
							</div>
							{tags?.length ? (
								<div className="tj-tags-post wow fadeInUp" data-wow-delay=".3s">
									<div className="tagcloud">
										<span>Tags:</span>
										{tags.map((tag, idx) => (
											<Link key={idx} href={`/blogs?tag=${makePath(tag)}`}>
												{tag}
											</Link>
										))}
									</div>
								</div>
							) : null}
							<div className="tj-post__navigation wow fadeInUp" data-wow-delay="0.3s">
								<div className="tj-nav__post previous" style={{ visibility: isPrevItem ? "visible" : "hidden" }}>
									<div className="tj-nav-post__nav prev_post">
										<Link href={isPrevItem ? `/blogs/${prevSlug}` : "/blogs"}>
											<span>
												<i className="tji-arrow-left"></i>
											</span>
											Previous
										</Link>
									</div>
								</div>
								<Link href={"/blogs"} className="tj-nav-post__grid" aria-label="All blogs">
									<i className="tji-window"></i>
								</Link>
								<div className="tj-nav__post next" style={{ visibility: isNextItem ? "visible" : "hidden" }}>
									<div className="tj-nav-post__nav next_post">
										<Link href={isNextItem ? `/blogs/${nextSlug}` : "/blogs"}>
											Next
											<span>
												<i className="tji-arrow-right"></i>
											</span>
										</Link>
									</div>
								</div>
							</div>
						</article>
					</div>
					<div className="col-lg-4">
						<BlogSidebar posts={posts} currentSlug={currentItem?.slug} />
					</div>
				</div>
			</div>
		</section>
	);
};

export default BlogDetailsPrimary;
