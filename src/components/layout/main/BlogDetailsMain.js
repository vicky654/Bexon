import BlogDetailsPrimary from "@/components/sections/blogs/BlogDetailsPrimary";
import HeroInner from "@/components/sections/hero/HeroInner";
import { getBlogsFromBackend } from "@/libs/blogsApi";
import getPreviousNextItem from "@/libs/getPreviousNextItem";

const BlogDetailsMain = async ({ currentSlug }) => {
	const items = await getBlogsFromBackend();
	const currentId = items?.find(({ slug }) => slug === currentSlug)?.id;
	const option = getPreviousNextItem(items, currentId);
	const { title } = option?.currentItem || {};
	const prevSlug = items?.find(({ id }) => id === option?.prevId)?.slug;
	const nextSlug = items?.find(({ id }) => id === option?.nextId)?.slug;

	return (
		<div>
			<HeroInner
				title={"Blog Details"}
				text={title ? title : "Blog Details"}
				breadcrums={[{ name: "Blogs", path: "/blogs" }]}
			/>
			<BlogDetailsPrimary option={{ ...option, prevSlug, nextSlug }} />
		</div>
	);
};

export default BlogDetailsMain;
