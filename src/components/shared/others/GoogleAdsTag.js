import Script from "next/script";
import { GOOGLE_ADS_ID } from "@/libs/tracking";

const GoogleAdsTag = () => (
	<>
		<Script
			src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
			strategy="lazyOnload"
		/>
		<Script id="google-ads-gtag" strategy="lazyOnload">
			{`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');`}
		</Script>
	</>
);

export default GoogleAdsTag;
