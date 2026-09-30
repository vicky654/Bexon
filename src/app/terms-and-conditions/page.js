import ContentPage from "@/components/sections/page/ContentPage";
import { getPage } from "@/content/pages";

const page = getPage("/terms-and-conditions");
export const metadata = { title: `${page.title} | DPDP Consultants`, description: page.description };
export default function TermsAndConditions() {
	return <ContentPage page={page} />;
}
