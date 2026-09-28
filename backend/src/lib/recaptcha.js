async function verifyRecaptcha(token, ip) {
	if (!process.env.RECAPTCHA_SECRET) {
		console.warn("RECAPTCHA_SECRET not configured, skipping reCAPTCHA check.");
		return true;
	}
	if (!token) return false;

	const form = new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET, response: token });
	if (ip) form.set("remoteip", ip);

	try {
		const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
			method: "POST",
			body: form,
			signal: AbortSignal.timeout(10 * 1000),
		});
		const body = await res.json();
		return body?.success === true;
	} catch (error) {
		console.error("reCAPTCHA verification request failed:", error.message);
		return false;
	}
}

module.exports = { verifyRecaptcha };
