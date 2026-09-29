import ContentPage from "@/components/sections/page/ContentPage";
import { getPage } from "@/content/pages";

const page = getPage("/dpdp-act");
export const metadata = { title: `${page.title} | DPDP Consultants`, description: page.description };
export default function DpdpActPage() {
	return <ContentPage page={page} />;
}
