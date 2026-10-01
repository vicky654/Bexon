import { Mona_Sans } from "next/font/google";
import "./assets/css/dpdp-icons.css";
import "./assets/css/bootstrap.min.css";
import "./assets/css/font-awesome-subset.css";
import "./assets/css/meanmenu.css";
import "./assets/css/nice-select2.css";
import "./globals.scss";
import { getSiteSettings } from "@/libs/settingsApi";
import GoogleAdsTag from "@/components/shared/others/GoogleAdsTag";
import TrackingCapture from "@/components/shared/others/TrackingCapture";
import OrganizationJsonLd from "@/components/shared/others/OrganizationJsonLd";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/libs/seo";

const bodyFont = Mona_Sans({
	variable: "--tj-ff-body",
	subsets: ["latin"],
	weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
	style: ["normal"],
	display: "swap",
});
const headingFont = Mona_Sans({
	variable: "--tj-ff-heading",
	subsets: ["latin"],
	weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
	style: ["normal"],
	display: "swap",
});

// Site-wide defaults; each page sets its own title, description and canonical
// path via pageMetadata() in src/libs/seo.js.
export const metadata = {
	metadataBase: new URL(SITE_URL),
	title: SITE_NAME,
	description: "DPDP Consultants - Empowering Privacy in Digital World",
	applicationName: SITE_NAME,
	openGraph: {
		type: "website",
		siteName: SITE_NAME,
		locale: "en_IN",
		images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
	},
	twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE] },
	robots: { index: true, follow: true },
};

// Every value here comes straight from the backend, which already rejects
// anything that isn't ^#[0-9A-Fa-f]{6}$ before persisting it (see
// backend/src/routes/adminSettings.js) — getSiteSettings() only ever reads
// from that backend, so raw interpolation into this CSS string is safe.
// secondaryColor maps to both --tj-color-theme-secondary (reserved for
// future direct use) and --tj-color-theme-dark, which is the variable the
// site's SCSS actually consumes (195 usages) for this color.
function buildThemeOverrideCss(settings) {
	if (!settings) return null;
	return `:root {
  --tj-color-theme-primary: ${settings.primaryColor};
  --tj-color-theme-secondary: ${settings.secondaryColor};
  --tj-color-theme-dark: ${settings.secondaryColor};
  --tj-color-theme-hover: ${settings.hoverColor};
  --tj-color-text-body: ${settings.textColor};
  --tj-color-heading-primary: ${settings.headingColor};
  --tj-color-theme-bg: ${settings.backgroundColor};
}`;
}

export default async function RootLayout({ children }) {
	const settings = await getSiteSettings();
	const themeCss = buildThemeOverrideCss(settings);

	return (
		<html lang="en" data-scroll-behavior="smooth" dir="ltr">
			<body className={`${bodyFont.variable} ${headingFont.variable}`}>
				{themeCss ? (
					<style precedence="high" href="site-settings-overrides">
						{themeCss}
					</style>
				) : null}
				<OrganizationJsonLd />
				{children}
				<TrackingCapture />
				<GoogleAdsTag />
			</body>
		</html>
	);
}
