"use client";

import { useEffect, useRef } from "react";

let scriptPromise;
const SCRIPT_LOAD_TIMEOUT_MS = 15 * 1000;

function loadRecaptchaScript() {
	if (window.grecaptcha?.render) return Promise.resolve();
	if (!scriptPromise) {
		scriptPromise = new Promise((resolve, reject) => {
			let settled = false;
			const timeoutId = setTimeout(fail, SCRIPT_LOAD_TIMEOUT_MS);

			function succeed() {
				if (settled) return;
				settled = true;
				clearTimeout(timeoutId);
				resolve();
			}

			// A blocked/failed script load or a load that never calls back (e.g. a
			// content blocker silently dropping the request) must not leave later
			// mounts stuck awaiting a promise that will never resolve, so clear the
			// cache and let the next mount try again.
			function fail() {
				if (settled) return;
				settled = true;
				clearTimeout(timeoutId);
				scriptPromise = null;
				reject(new Error("Failed to load the reCAPTCHA script"));
			}

			window.__onRecaptchaLoad = succeed;
			const script = document.createElement("script");
			script.src = "https://www.google.com/recaptcha/api.js?onload=__onRecaptchaLoad&render=explicit";
			script.async = true;
			script.defer = true;
			script.onerror = fail;
			document.head.appendChild(script);
		});
	}
	return scriptPromise;
}

// reCAPTCHA v2 checkbox. Remount it (change its React key) to reset it.
const Recaptcha = ({ siteKey, onChange, onError }) => {
	const containerRef = useRef(null);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;
	const onErrorRef = useRef(onError);
	onErrorRef.current = onError;

	useEffect(() => {
		let cancelled = false;
		loadRecaptchaScript()
			.then(() => {
				if (cancelled || !containerRef.current) return;
				window.grecaptcha.render(containerRef.current, {
					sitekey: siteKey,
					callback: token => onChangeRef.current(token),
					"expired-callback": () => onChangeRef.current(""),
					"error-callback": () => onChangeRef.current(""),
				});
			})
			.catch(() => {
				if (cancelled) return;
				onErrorRef.current?.();
			});
		return () => {
			cancelled = true;
		};
	}, [siteKey]);

	return <div ref={containerRef} />;
};

export default Recaptcha;
