"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSweetAlert from "@/hooks/useSweetAlert";
import { markContactSubmitted, readTracking } from "@/libs/tracking";
import { DOWNLOAD_URL_KEY, isLeadFormType, isSafeDownloadUrl, leadForm, oneMonthAfterUtc } from "@/libs/leadForms";

const emptyFormData = {
	name: "",
	email: "",
	phone: "",
	company: "",
	topic: "",
	partnershipType: "",
	preferredAt: "",
	message: "",
};

const REQUIRED_MESSAGES = {
	name: "Please enter your name.",
	company: "Please enter your company name.",
	topic: "Please choose the purpose of reaching out.",
	partnershipType: "Please choose a partnership type.",
	message: "Please enter a message.",
};

const RESEND_WAIT_SECONDS = 30;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const TIME_WINDOW_MESSAGE = "Please choose a time at least 24 hours from now and within one month.";

async function postJson(url, body) {
	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	const data = await res.json().catch(() => ({}));
	return { status: res.status, ok: res.ok, data };
}

const useContactForm = (type = "contact", { contentId } = {}) => {
	const formType = isLeadFormType(type) ? type : "contact";
	const { fields, required } = leadForm(formType);
	const creteAlert = useSweetAlert();
	const router = useRouter();
	const [formData, setFormData] = useState({ ...emptyFormData });
	const [config, setConfig] = useState({ verification: false, recaptchaSiteKey: "", notices: {} });
	const [step, setStep] = useState("form");
	const [verificationId, setVerificationId] = useState("");
	const [otp, setOtp] = useState("");
	const [otpError, setOtpError] = useState("");
	const [recaptchaToken, setRecaptchaToken] = useState("");
	const [recaptchaKey, setRecaptchaKey] = useState(0);
	const [consentOpen, setConsentOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [resendIn, setResendIn] = useState(0);
	const [isResending, setIsResending] = useState(false);

	useEffect(() => {
		fetch(`/api/contact/config?type=${formType}`)
			.then(res => (res.ok ? res.json() : null))
			.then(data => {
				if (data) setConfig(data);
			})
			.catch(() => {});
	}, [formType]);

	// The footer's newsletter box hands off the email via sessionStorage
	// instead of a `?email=` query string (which Google Ads would otherwise
	// log via page_location). Pick it up once on mount and clear it.
	useEffect(() => {
		if (formType !== "newsletter") return;
		try {
			const stored = sessionStorage.getItem("dpdp-subscribe-email");
			if (stored) {
				sessionStorage.removeItem("dpdp-subscribe-email");
				setFormData(prev => ({ ...prev, email: stored.toLowerCase().slice(0, 254) }));
			}
		} catch {
			// sessionStorage can throw (private mode, blocked storage); the
			// form still works, just without the pre-fill.
		}
	}, [formType]);

	useEffect(() => {
		if (resendIn <= 0) return;
		const timer = setTimeout(() => setResendIn(seconds => seconds - 1), 1000);
		return () => clearTimeout(timer);
	}, [resendIn]);

	const recaptchaRequired = Boolean(config.recaptchaSiteKey);
	const canProceed = otp.length === 6 && (!recaptchaRequired || Boolean(recaptchaToken));

	const handleChange = e => {
		const { name } = e.target;
		let { value } = e.target;
		if (name === "phone") value = value.replace(/\D/g, "").slice(0, 10);
		if (name === "email") value = value.toLowerCase();
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleTopicChange = option => {
		setFormData(prev => ({ ...prev, topic: option?.value || "" }));
	};

	const handlePartnershipChange = option => {
		setFormData(prev => ({ ...prev, partnershipType: option?.value || "" }));
	};

	const resetRecaptcha = () => {
		setRecaptchaToken("");
		setRecaptchaKey(key => key + 1);
	};

	const backToForm = () => {
		setStep("form");
		setVerificationId("");
		setOtp("");
		setOtpError("");
		setConsentOpen(false);
		resetRecaptcha();
	};

	const finish = (data = {}) => {
		markContactSubmitted();
		if (isSafeDownloadUrl(data.downloadUrl)) {
			try {
				sessionStorage.setItem(DOWNLOAD_URL_KEY, data.downloadUrl);
			} catch {}
			const link = document.createElement("a");
			link.href = data.downloadUrl;
			// No download attribute: the backend sends Content-Disposition: attachment,
			// so success saves the PDF in place, while an error redirect (expired or
			// missing file) shows the notice on the resource page instead of being saved.
			document.body.appendChild(link);
			link.click();
			link.remove();
		}
		router.push(`/thank-you?type=${formType}`);
	};

	const handleSubmit = async e => {
		e.preventDefault();

		for (const field of ["name", "company", "topic", "partnershipType", "message"]) {
			if (required.includes(field) && !String(formData[field]).trim()) {
				creteAlert("error", REQUIRED_MESSAGES[field]);
				return;
			}
		}
		if (!emailPattern.test(formData.email.trim())) {
			creteAlert("error", "Please enter a valid email address.");
			return;
		}
		if (formData.phone.length !== 10) {
			creteAlert("error", "Please enter a 10-digit phone number.");
			return;
		}
		if (formData.preferredAt) {
			const at = new Date(formData.preferredAt);
			const now = new Date();
			const earliest = new Date(now.getTime() + DAY_MS);
			if (Number.isNaN(at.getTime()) || at < earliest || at > oneMonthAfterUtc(now)) {
				creteAlert("error", TIME_WINDOW_MESSAGE);
				return;
			}
		}

		setIsSubmitting(true);
		try {
			const payload = { type: formType, tracking: readTracking() };
			if (contentId) payload.contentId = contentId;
			for (const field of fields) payload[field] = formData[field];
			if (payload.preferredAt) {
				const at = new Date(payload.preferredAt);
				if (!Number.isNaN(at.getTime())) payload.preferredAt = at.toISOString();
			}
			const { ok, data } = await postJson("/api/contact/start", payload);
			if (!ok) {
				creteAlert("error", data?.message || "Something went wrong. Please try again.");
				return;
			}
			if (data.done) {
				finish(data);
				return;
			}
			setVerificationId(data.verificationId);
			setOtp("");
			setOtpError("");
			resetRecaptcha();
			setResendIn(RESEND_WAIT_SECONDS);
			setStep("otp");
		} catch {
			creteAlert("error", "Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleOtpChange = e => {
		setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
		setOtpError("");
	};

	const resendCode = async () => {
		if (resendIn > 0 || isResending) return;
		setIsResending(true);
		try {
			const { status, ok, data } = await postJson("/api/contact/resend", { verificationId });
			if (ok) {
				setOtp("");
				setOtpError("");
				setResendIn(RESEND_WAIT_SECONDS);
				creteAlert("success", `A new code has been sent to ${formData.email}.`);
				return;
			}
			creteAlert("error", data?.message || "Couldn't resend the code. Please try again.");
			if (status === 410) backToForm();
		} catch {
			creteAlert("error", "Couldn't resend the code. Please try again.");
		} finally {
			setIsResending(false);
		}
	};

	const openConsent = () => {
		if (canProceed) setConsentOpen(true);
	};

	const closeConsent = () => setConsentOpen(false);

	const agree = async language => {
		setIsSubmitting(true);
		try {
			const { status, ok, data } = await postJson("/api/contact/verify", {
				verificationId,
				otp,
				language,
				recaptchaToken,
			});
			if (ok) {
				finish(data);
				return;
			}
			setConsentOpen(false);
			// The backend has already consumed this reCAPTCHA token (tokens are
			// single-use), so any failed /verify must reset it before the visitor
			// can retry, whichever branch below runs next.
			resetRecaptcha();
			if (data?.field === "otp") {
				setOtpError(data.message || "Invalid OTP");
				return;
			}
			if (data?.field === "recaptcha") {
				creteAlert("error", data.message);
				return;
			}
			creteAlert("error", data?.message || "Something went wrong. Please try again.");
			if (status === 410 || status === 429) backToForm();
		} catch {
			creteAlert("error", "Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return {
		type: formType,
		fields,
		required,
		formData,
		step,
		config,
		isSubmitting,
		otp,
		otpError,
		recaptchaKey,
		canProceed,
		resendIn,
		isResending,
		consentOpen,
		handleChange,
		handleTopicChange,
		handlePartnershipChange,
		handleSubmit,
		handleOtpChange,
		setRecaptchaToken,
		changeDetails: backToForm,
		resendCode,
		openConsent,
		closeConsent,
		agree,
	};
};

export default useContactForm;
