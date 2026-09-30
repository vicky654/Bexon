import ContentPage from "@/components/sections/page/ContentPage";
import { getPage } from "@/content/pages";

const page = getPage("/");
export const metadata = { title: `${page.title} | DPDP Consultants`, description: page.description };
export default function Home() {
	return <ContentPage page={page} />;
}
