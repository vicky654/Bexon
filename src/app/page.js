import ContentPage from "@/components/sections/page/ContentPage";
import { getPage } from "@/content/pages";
import { pageMetadata } from "@/libs/seo";

const page = getPage("/");
export const metadata = pageMetadata({ title: `${page.title} | DPDP Consultants`, description: page.description, path: page.path });
export default function Home() {
	return <ContentPage page={page} />;
}
