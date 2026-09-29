"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

// The Google Ads tag sends page_location (including the query string) to
// Google, so a GET-submitted `/subscribe?email=...` would leak visitor
// emails. Instead we stash the email in sessionStorage and navigate to a
// plain `/subscribe`; the newsletter form there reads it back on mount.
const FooterSubscribeForm = () => {
	const router = useRouter();

	const handleSubmit = e => {
		e.preventDefault();
		const form = e.currentTarget;
		if (!form.checkValidity()) {
			form.reportValidity();
			return;
		}
		const email = form.elements.email.value;
		try {
			sessionStorage.setItem("dpdp-subscribe-email", email);
		} catch {
			// sessionStorage can throw (private mode, blocked storage); the
			// subscribe page's form still works, just without the pre-fill.
		}
		router.push("/subscribe");
	};

	return (
		<form onSubmit={handleSubmit}>
			<input type="email" name="email" placeholder="Enter email" maxLength={254} required />
			<button type="submit" aria-label="Subscribe">
				<i className="tji-plane"></i>
			</button>
			<label htmlFor="agree">
				<input id="agree" type="checkbox" required />
				Agree to our{" "}
				<Link href="/terms-and-conditions">Terms & Condition?</Link>
			</label>
		</form>
	);
};

export default FooterSubscribeForm;
