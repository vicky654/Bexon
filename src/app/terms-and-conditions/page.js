import ContentPage from "@/components/sections/page/ContentPage";
import { getPage } from "@/content/pages";
import { pageMetadata } from "@/libs/seo";

const page = getPage("/terms-and-conditions");
export const metadata = pageMetadata({ title: `${page.title} | DPDP Consultants`, description: page.description, path: page.path });
export default function TermsAndConditions() {
	return <ContentPage page={page} />;
}
