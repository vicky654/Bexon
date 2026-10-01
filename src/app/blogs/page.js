import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";
import BlogsPrimary from "@/components/sections/blogs/BlogsPrimary";
import Cta from "@/components/sections/cta/Cta";
import HeroInner from "@/components/sections/hero/HeroInner";
import BackToTop from "@/components/shared/others/BackToTop";
import HeaderSpace from "@/components/shared/others/HeaderSpace";
import ClientWrapper from "@/components/shared/wrappers/ClientWrapper";
import { getBlogsFromBackend } from "@/libs/blogsApi";
import makeText from "@/libs/makeText";
import { pageMetadata } from "@/libs/seo";
import { notFound } from "next/navigation";

const PER_PAGE = 9;
const FILTERS = ["category", "tag", "author_role", "search"];

function readQuery(params) {
	const query = {};
	for (const key of FILTERS) {
		const value = typeof params?.[key] === "string" ? params[key].trim().slice(0, 100) : "";
		if (value) query[key] = value;
	}
	const page = Math.max(1, Number.parseInt(params?.page, 10) || 1);
	return { query, page };
}

function heading(query) {
	if (query.category) return { title: `Category: ${makeText(query.category, true)}`, crumb: makeText(query.category, true) };
	if (query.tag) return { title: `Tag: ${makeText(query.tag, true)}`, crumb: makeText(query.tag, true) };
	if (query.author_role) return { title: query.author_role, crumb: query.author_role };
	if (query.search) return { title: `Search: ${query.search}`, crumb: query.search };
	return { title: "Read Blog", crumb: "Blogs" };
}

// Title and description carried over from the old site's blogs.php. Page 2+
// keeps its own canonical; filtered and search views are not indexed.
export async function generateMetadata({ searchParams }) {
	const { query, page } = readQuery(await searchParams);
	const filtered = Object.keys(query).length > 0;
	const qs = page > 1 ? `?page=${page}` : "";
	return pageMetadata({
		title: `Blogs updates on DPDP Act compliance${page > 1 ? ` - Page ${page}` : ""} | DPDP Consultants`,
		description: "Explore articles on DPDP Act updates, privacy enforcement, best practices and guides to strengthen compliance.",
		path: `/blogs${filtered ? "" : qs}`,
		noindex: filtered,
	});
}

export default async function Blogs({ searchParams }) {
	const { query, page } = readQuery(await searchParams);
	const filtered = Object.keys(query).length > 0;
	const [matching, allPosts] = await Promise.all([getBlogsFromBackend(query), filtered ? getBlogsFromBackend() : null]);
	const totalPages = Math.max(1, Math.ceil(matching.length / PER_PAGE));
	if (page > totalPages) notFound();
	const current = page;
	const posts = matching.slice((current - 1) * PER_PAGE, current * PER_PAGE);
	const { title, crumb } = heading(query);

	return (
		<div>
			<BackToTop />
			<Header />
			<Header isStickyHeader={true} />
			<div id="smooth-wrapper">
				<div id="smooth-content">
					<main>
						<HeaderSpace />
						<HeroInner title={title} text={crumb} breadcrums={filtered ? [{ name: "Blogs", path: "/blogs" }] : []} />
						<BlogsPrimary posts={posts} allPosts={allPosts || matching} page={current} totalPages={totalPages} query={query} />
						<Cta />
					</main>
					<Footer />
				</div>
			</div>
			<ClientWrapper />
		</div>
	);
}
