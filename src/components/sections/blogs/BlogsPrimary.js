import BlogSingle from "@/components/shared/blogs/BlogSingle";
import BlogSidebar from "@/components/shared/sidebar/BlogSidebar";
import Link from "next/link";

// Blog list, rendered on the server so search engines see every post link.
// Pagination uses real links (/blogs?page=2) that crawlers can follow.
const pageHref = (query, page) => {
	const params = new URLSearchParams(query);
	if (page > 1) params.set("page", String(page));
	else params.delete("page");
	const qs = params.toString();
	return `/blogs${qs ? `?${qs}` : ""}`;
};

const BlogsPrimary = ({ posts, allPosts, page, totalPages, query = {} }) => (
	<section className="tj-blog-section section-gap">
		<div className="container">
			<div className="row row-gap-5">
				<div className="col-lg-8">
					<div className="blog-post-wrapper">
						{posts.length ? (
							posts.map((blog, idx) => <BlogSingle key={blog.slug} blog={blog} idx={idx} />)
						) : (
							<p className="content-empty">No posts found. Try another search or browse all blogs.</p>
						)}
						{totalPages > 1 ? (
							<nav className="tj-pagination d-flex" aria-label="Blog pages">
								<ul>
									{page > 1 ? (
										<li>
											<Link className="page-numbers prev" href={pageHref(query, page - 1)} aria-label="Previous page">
												<i className="tji-arrow-left-long" aria-hidden="true"></i>
											</Link>
										</li>
									) : null}
									{Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
										<li key={n}>
											<Link
												className={`page-numbers${n === page ? " current" : ""}`}
												href={pageHref(query, n)}
												aria-current={n === page ? "page" : undefined}
												aria-label={`Page ${n}`}
											>
												{String(n).padStart(2, "0")}
											</Link>
										</li>
									))}
									{page < totalPages ? (
										<li>
											<Link className="page-numbers next" href={pageHref(query, page + 1)} aria-label="Next page">
												<i className="tji-arrow-right-long" aria-hidden="true"></i>
											</Link>
										</li>
									) : null}
								</ul>
							</nav>
						) : null}
					</div>
				</div>
				<div className="col-lg-4">
					<BlogSidebar posts={allPosts} />
				</div>
			</div>
		</div>
	</section>
);

export default BlogsPrimary;
