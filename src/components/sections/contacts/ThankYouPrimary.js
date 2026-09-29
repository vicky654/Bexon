"use client";

import { useEffect, useState } from "react";
import ButtonPrimary from "@/components/shared/buttons/ButtonPrimary";
import { consumeContactSubmitted, GOOGLE_ADS_CONVERSION } from "@/libs/tracking";
import { DOWNLOAD_URL_KEY, leadForm } from "@/libs/leadForms";

const ThankYouPrimary = ({ type }) => {
	const [downloadUrl, setDownloadUrl] = useState("");

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

	useEffect(() => {
		if (type !== "resource") return;
		try {
			const stored = sessionStorage.getItem(DOWNLOAD_URL_KEY);
			if (stored) setDownloadUrl(stored);
		} catch {
			// sessionStorage can throw (private mode, blocked storage); the
			// page still works, just without the "download again" link.
		}
	}, [type]);

	return (
		<section className="section-gap">
			<div className="container">
				<div className="row justify-content-center">
					<div className="col-lg-8 text-center">
						<h5 className="mb-3">You matter. We matter.</h5>
						<h2 className="sec-title mb-4">Data Privacy Matters.</h2>
						<p className="mb-5">{leadForm(type).thankYou}</p>
						{downloadUrl ? (
							<p className="mb-4">
								<a className="tj-primary-btn" href={downloadUrl}>
									<span className="btn-text">
										<span>Download again</span>
									</span>
									<span className="btn-icon">
										<i className="tji-arrow-right-long"></i>
									</span>
								</a>
							</p>
						) : null}
						<ButtonPrimary text={"Back to Home"} url={"/"} />
					</div>
				</div>
			</div>
		</section>
	);
};

export default ThankYouPrimary;
