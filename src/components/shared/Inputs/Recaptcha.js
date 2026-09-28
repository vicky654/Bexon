"use client";

import { useEffect, useRef } from "react";

let scriptPromise;

function loadRecaptchaScript() {
	if (window.grecaptcha?.render) return Promise.resolve();
	if (!scriptPromise) {
		scriptPromise = new Promise(resolve => {
			window.__onRecaptchaLoad = resolve;
			const script = document.createElement("script");
			script.src = "https://www.google.com/recaptcha/api.js?onload=__onRecaptchaLoad&render=explicit";
			script.async = true;
			script.defer = true;
			document.head.appendChild(script);
		});
	}
	return scriptPromise;
}

// reCAPTCHA v2 checkbox. Remount it (change its React key) to reset it.
const Recaptcha = ({ siteKey, onChange }) => {
	const containerRef = useRef(null);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	useEffect(() => {
		let cancelled = false;
		loadRecaptchaScript().then(() => {
			if (cancelled || !containerRef.current) return;
			window.grecaptcha.render(containerRef.current, {
				sitekey: siteKey,
				callback: token => onChangeRef.current(token),
				"expired-callback": () => onChangeRef.current(""),
				"error-callback": () => onChangeRef.current(""),
			});
		});
		return () => {
			cancelled = true;
		};
	}, [siteKey]);

	return <div ref={containerRef} />;
};

export default Recaptcha;
