"use client";

import { useEffect, useState } from "react";
import fallbackBrands from "../../public/fakedata/brands.json";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function useBrands() {
	const [brands, setBrands] = useState(fallbackBrands);

	useEffect(() => {
		let cancelled = false;

		fetch(`${BACKEND_URL}/api/brand-logos`, { cache: "no-store" })
			.then(res => (res.ok ? res.json() : Promise.reject(new Error(`Backend responded with ${res.status}`))))
			.then(data => {
				if (cancelled) return;
				const logos = Array.isArray(data.logos) ? data.logos : [];
				if (logos.length) {
					setBrands(
						logos.map(logo => ({
							img: logo.imageUrl,
							img2: logo.imageUrl,
							img3: logo.imageUrl,
							alt: logo.alt,
						}))
					);
				}
			})
			.catch(error => {
				console.error("Falling back to bundled brand logos:", error.message);
			});

		return () => {
			cancelled = true;
		};
	}, []);

	return brands;
}
