import ContentPage from "@/components/sections/page/ContentPage";
import { childPages, getPage } from "@/content/pages";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/libs/seo";

export function generateStaticParams() {
	return childPages("/services").map(page => ({ slug: page.path.split("/").pop() }));
}

export async function generateMetadata({ params }) {
	const { slug } = await params;
	const page = getPage(`/services/${slug}`);
	return page ? pageMetadata({ title: `${page.title} | DPDP Consultants`, description: page.description, path: page.path }) : {};
}

export default async function ServicesChildPage({ params }) {
	const { slug } = await params;
	const page = getPage(`/services/${slug}`);
	if (!page) notFound();
	return <ContentPage page={page} />;
}
