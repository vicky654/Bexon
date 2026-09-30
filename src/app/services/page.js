import ContentPage from "@/components/sections/page/ContentPage";
import { getPage } from "@/content/pages";

const page = getPage("/services");
export const metadata = { title: `${page.title} | DPDP Consultants`, description: page.description };
export default function ServicesPage() {
	return <ContentPage page={page} />;
}
