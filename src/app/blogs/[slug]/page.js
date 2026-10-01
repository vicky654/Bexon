import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";
import BlogDetailsMain from "@/components/layout/main/BlogDetailsMain";
import Cta from "@/components/sections/cta/Cta";
import BackToTop from "@/components/shared/others/BackToTop";
import HeaderSpace from "@/components/shared/others/HeaderSpace";
import ClientWrapper from "@/components/shared/wrappers/ClientWrapper";
import { getBlogFromBackendBySlug, getBlogsFromBackend } from "@/libs/blogsApi";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/libs/seo";
import coverImage from "@/libs/coverImage";
import JsonLd from "@/components/shared/others/JsonLd";
import { article } from "@/libs/structuredData";

export async function generateMetadata({ params }) {
	const { slug } = await params;
	const blog = await getBlogFromBackendBySlug(slug);
	if (!blog) return {};
	return pageMetadata({
		// Migrated posts keep the <title> they ranked with on the old site.
		title: blog.metaTitle || `${blog.title} | DPDP Consultants`,
		description: blog.desc || undefined,
		path: `/blogs/${slug}`,
		image: coverImage(blog.img).endsWith(".svg") ? undefined : coverImage(blog.img),
	});
}

export default async function BlogDetails({ params }) {
	const { slug } = await params;
	const blog = await getBlogFromBackendBySlug(slug);

	if (!blog) {
		notFound();
	}

	return (
		<div>
			<JsonLd
				data={article({
					title: blog.title,
					description: blog.desc,
					path: `/blogs/${slug}`,
					image: coverImage(blog.img),
					publishedAt: blog.publishedAt,
					updatedAt: blog.updatedAt,
					author: blog.author,
				})}
			/>
			<BackToTop />
			<Header />
			<Header isStickyHeader={true} />
			<div id="smooth-wrapper">
				<div id="smooth-content">
					<main>
						<HeaderSpace />
						<BlogDetailsMain currentSlug={slug} />
						<Cta />
					</main>
					<Footer />
				</div>
			</div>
			<ClientWrapper />
		</div>
	);
}

export async function generateStaticParams() {
	const items = await getBlogsFromBackend();
	return items?.map(({ slug }) => ({ slug }));
}
