import Script from "next/script";
import { GOOGLE_TAG_MANAGER_ID } from "@/libs/tracking";

// Google Tag Manager container from the old site (standard snippet).
export const GoogleTagManagerScript = () => (
	<Script id="google-tag-manager" strategy="afterInteractive">
		{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GOOGLE_TAG_MANAGER_ID}');`}
	</Script>
);

export const GoogleTagManagerNoscript = () => (
	<noscript>
		<iframe
			src={`https://www.googletagmanager.com/ns.html?id=${GOOGLE_TAG_MANAGER_ID}`}
			height="0"
			width="0"
			style={{ display: "none", visibility: "hidden" }}
			title="Google Tag Manager"
		/>
	</noscript>
);
