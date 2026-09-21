import { Mona_Sans } from "next/font/google";
import "react-range-slider-input/dist/style.css";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/thumbs";
import "./assets/css/animate.min.css";
import "./assets/css/bexon-icons.css";
import "./assets/css/bootstrap.min.css";
import "./assets/css/font-awesome-pro.min.css";
import "./assets/css/glightbox.min.css";
import "./assets/css/meanmenu.css";
import "./assets/css/nice-select2.css";
import "./assets/css/odometer-theme-default.css";
import "./globals.scss";
import { getSiteSettings } from "@/libs/settingsApi";

const bodyFont = Mona_Sans({
	variable: "--tj-ff-body",
	subsets: ["latin"],
	weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
	style: ["normal", "italic"],
	display: "swap",
});
const headingFont = Mona_Sans({
	variable: "--tj-ff-heading",
	subsets: ["latin"],
	weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
	style: ["normal", "italic"],
	display: "swap",
});

export const metadata = {
	title: "DPDP Consultants",
	description: "DPDP Consultants - Empowering Privacy in Digital World",
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
				{children}
			</body>
		</html>
	);
}
