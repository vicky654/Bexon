import ContentPage from "@/components/sections/page/ContentPage";
import { getPage } from "@/content/pages";

const page = getPage("/case-studies");
export const metadata = { title: `${page.title} | DPDP Consultants`, description: page.description };
export default function CaseStudies() {
	return <ContentPage page={page} />;
}
