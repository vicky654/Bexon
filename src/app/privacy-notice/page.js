import ContentPage from "@/components/sections/page/ContentPage";
import { getPage } from "@/content/pages";

const page = getPage("/privacy-notice");
export const metadata = { title: `${page.title} | DPDP Consultants`, description: page.description };
export default function PrivacyNotice() {
	return <ContentPage page={page} />;
}
