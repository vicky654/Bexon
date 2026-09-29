import ContentPage from "@/components/sections/page/ContentPage";
import { childPages, getPage } from "@/content/pages";
import { notFound } from "next/navigation";

export function generateStaticParams() {
	return childPages("/dpdp-act").map(page => ({ slug: page.path.split("/").pop() }));
}

export async function generateMetadata({ params }) {
	const { slug } = await params;
	const page = getPage(`/dpdp-act/${slug}`);
	return page ? { title: `${page.title} | DPDP Consultants`, description: page.description } : {};
}

export default async function DpdpActChildPage({ params }) {
	const { slug } = await params;
	const page = getPage(`/dpdp-act/${slug}`);
	if (!page) notFound();
	return <ContentPage page={page} />;
}
