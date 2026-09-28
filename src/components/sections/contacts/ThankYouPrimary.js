"use client";

import { useEffect } from "react";
import ButtonPrimary from "@/components/shared/buttons/ButtonPrimary";
import { consumeContactSubmitted, GOOGLE_ADS_CONVERSION } from "@/libs/tracking";

const ThankYouPrimary = () => {
	useEffect(() => {
		if (!consumeContactSubmitted()) return;
		// gtag.js may still be loading; queueing on dataLayer is how gtag
		// itself buffers calls until it's ready.
		window.dataLayer = window.dataLayer || [];
		window.gtag =
			window.gtag ||
			function gtag() {
				window.dataLayer.push(arguments);
			};
		window.gtag("event", "conversion", { send_to: GOOGLE_ADS_CONVERSION });
	}, []);

	return (
		<section className="section-gap">
			<div className="container">
				<div className="row justify-content-center">
					<div className="col-lg-8 text-center">
						<h5 className="mb-3">You matter. We matter.</h5>
						<h2 className="sec-title mb-4">Data Privacy Matters.</h2>
						<p className="mb-5">
							Thank you for contacting DPDP Consultants; Our Privacy Expert will reach out to you shortly.
						</p>
						<ButtonPrimary text={"Back to Home"} url={"/"} />
					</div>
				</div>
			</div>
		</section>
	);
};

export default ThankYouPrimary;
