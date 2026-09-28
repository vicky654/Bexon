"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSweetAlert from "@/hooks/useSweetAlert";
import { markContactSubmitted, readTracking } from "@/libs/tracking";

const initialFormData = {
	name: "",
	email: "",
	phone: "",
	topic: "",
	message: "",
};

const RESEND_WAIT_SECONDS = 30;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function postJson(url, body) {
	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	const data = await res.json().catch(() => ({}));
	return { status: res.status, ok: res.ok, data };
}

const useContactForm = () => {
	const creteAlert = useSweetAlert();
	const router = useRouter();
	const [formData, setFormData] = useState(initialFormData);
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

	useEffect(() => {
		fetch("/api/contact/config")
			.then(res => (res.ok ? res.json() : null))
			.then(data => {
				if (data) setConfig(data);
			})
			.catch(() => {});
	}, []);

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

	const finish = () => {
		markContactSubmitted();
		router.push("/thank-you");
	};

	const handleSubmit = async e => {
		e.preventDefault();

		if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
			creteAlert("error", "Please fill in your name, email and message.");
			return;
		}
		if (!emailPattern.test(formData.email.trim())) {
			creteAlert("error", "Please enter a valid email address.");
			return;
		}
		if (formData.phone.length !== 10) {
			creteAlert("error", "Please enter a 10-digit phone number.");
			return;
		}
		if (!formData.topic) {
			creteAlert("error", "Please choose the purpose of reaching out.");
			return;
		}

		setIsSubmitting(true);
		try {
			const { ok, data } = await postJson("/api/contact/start", { ...formData, tracking: readTracking() });
			if (!ok) {
				creteAlert("error", data?.message || "Something went wrong. Please try again.");
				return;
			}
			if (data.done) {
				finish();
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
		if (resendIn > 0) return;
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
				finish();
				return;
			}
			setConsentOpen(false);
			if (data?.field === "otp") {
				setOtpError(data.message || "Invalid OTP");
				return;
			}
			if (data?.field === "recaptcha") {
				resetRecaptcha();
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
		formData,
		step,
		config,
		isSubmitting,
		otp,
		otpError,
		recaptchaKey,
		canProceed,
		resendIn,
		consentOpen,
		handleChange,
		handleTopicChange,
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
