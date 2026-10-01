import ContentPage from "@/components/sections/page/ContentPage";
import { getPage } from "@/content/pages";
import { pageMetadata } from "@/libs/seo";

const page = getPage("/about");
export const metadata = pageMetadata({ title: `${page.title} | DPDP Consultants`, description: page.description, path: page.path });
export default function About() {
	return <ContentPage page={page} />;
}
