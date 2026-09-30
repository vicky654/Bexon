import ContentPage from "@/components/sections/page/ContentPage";
import { childPages, getPage } from "@/content/pages";
import { notFound } from "next/navigation";

export function generateStaticParams() {
	return childPages("/products").map(page => ({ slug: page.path.split("/").pop() }));
}

export async function generateMetadata({ params }) {
	const { slug } = await params;
	const page = getPage(`/products/${slug}`);
	return page ? { title: `${page.title} | DPDP Consultants`, description: page.description } : {};
}

export default async function ProductsChildPage({ params }) {
	const { slug } = await params;
	const page = getPage(`/products/${slug}`);
	if (!page) notFound();
	return <ContentPage page={page} />;
}
