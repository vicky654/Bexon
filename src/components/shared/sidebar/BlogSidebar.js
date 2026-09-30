import coverImage from "@/libs/coverImage";
import makePath from "@/libs/makePath";
import Link from "next/link";

// Blog sidebar built from the real (backend) posts: search, recent posts,
// categories with counts, and tags. `currentSlug` is left out of "Recent".
const BlogSidebar = ({ posts = [], currentSlug }) => {
	const recent = posts.filter(post => post.slug !== currentSlug).slice(0, 3);
	const categoryCounts = posts.reduce((acc, post) => {
		if (post.category) acc.set(post.category, (acc.get(post.category) || 0) + 1);
		return acc;
	}, new Map());
	const tags = [...new Set(posts.flatMap(post => post.tags || []))];

	return (
		<aside className="tj-main-sidebar page-sidebar">
			<div className="tj-sidebar-widget widget-search">
				<h4 className="widget-title">Search here</h4>
				<div className="search-box">
					<form action="/blogs" method="get" role="search">
						<input type="search" name="search" aria-label="Search blogs" placeholder="Search here" />
						<button type="submit" aria-label="Search">
							<i className="tji-search"></i>
						</button>
					</form>
				</div>
			</div>
			{recent.length ? (
				<div className="tj-sidebar-widget tj-recent-posts">
					<h4 className="widget-title">Recent posts</h4>
					<ul>
						{recent.map(post => (
							<li key={post.slug}>
								<div className="post-thumb">
									<Link href={`/blogs/${post.slug}`}>
										<img src={coverImage(post.img)} alt="" loading="lazy" />
									</Link>
								</div>
								<div className="post-content">
									<h6 className="post-title">
										<Link href={`/blogs/${post.slug}`}>{post.title}</Link>
									</h6>
									{post.date ? (
										<div className="blog-meta">
											<ul>
												<li>{post.date}</li>
											</ul>
										</div>
									) : null}
								</div>
							</li>
						))}
					</ul>
				</div>
			) : null}
			{categoryCounts.size ? (
				<div className="tj-sidebar-widget widget-categories">
					<h4 className="widget-title">Categories</h4>
					<ul>
						{[...categoryCounts].map(([category, count]) => (
							<li key={category}>
								<Link href={`/blogs?category=${makePath(category)}`}>
									{category} <span className="number">({String(count).padStart(2, "0")})</span>
								</Link>
							</li>
						))}
					</ul>
				</div>
			) : null}
			{tags.length ? (
				<div className="tj-sidebar-widget widget-tag-cloud">
					<h4 className="widget-title">Tags</h4>
					<nav>
						<div className="tagcloud">
							{tags.map(tag => (
								<Link key={tag} href={`/blogs?tag=${makePath(tag)}`}>
									{tag}
								</Link>
							))}
						</div>
					</nav>
				</div>
			) : null}
		</aside>
	);
};

export default BlogSidebar;
