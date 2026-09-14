import BlogDetailsPrimary from "@/components/sections/blogs/BlogDetailsPrimary";
import HeroInner from "@/components/sections/hero/HeroInner";
import { getBlogsFromBackend } from "@/libs/blogsApi";

const BlogDetailsMain = async ({ currentSlug }) => {
	const items = await getBlogsFromBackend();
	const currentIndex = items?.findIndex(({ slug }) => slug === currentSlug);
	const currentItem = items?.[currentIndex];
	const prevSlug = currentIndex > 0 ? items[currentIndex - 1]?.slug : undefined;
	const nextSlug =
		currentIndex < items.length - 1
			? items[currentIndex + 1]?.slug
			: undefined;
	const isPrevItem = currentIndex > 0;
	const isNextItem = currentIndex >= 0 && currentIndex < items.length - 1;
	const { title } = currentItem || {};

	return (
		<div>
			<HeroInner
				title={"Blog Details"}
				text={title ? title : "Blog Details"}
				breadcrums={[{ name: "Blogs", path: "/blogs" }]}
			/>
			<BlogDetailsPrimary
				option={{ currentItem, prevSlug, nextSlug, isPrevItem, isNextItem }}
			/>
		</div>
	);
};

export default BlogDetailsMain;
