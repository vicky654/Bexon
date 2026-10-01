"use client";

import { Fragment, useEffect, useState } from "react";
import ButtonPrimary from "@/components/shared/buttons/ButtonPrimary";
import ReactNiceSelect from "@/components/shared/Inputs/ReactNiceSelect";
import Recaptcha from "@/components/shared/Inputs/Recaptcha";
import ConsentModal from "@/components/sections/contacts/ConsentModal";
import { CONTACT_TOPIC_OPTIONS } from "@/libs/contactTopics";
import { PARTNERSHIP_OPTIONS, oneMonthAfterUtc } from "@/libs/leadForms";

// Fields + OTP step used by Contact3. `form` is the return
// value of useContactForm().
const ContactFormBody = ({ form, submitText }) => {
	const locked = form.step === "otp";
	const [recaptchaError, setRecaptchaError] = useState(false);
	const star = field => (form.required.includes(field) ? " *" : "");
	const [timeBounds, setTimeBounds] = useState({ min: "", max: "" });
	const [dateFocused, setDateFocused] = useState(false);

	// datetime-local wants local "YYYY-MM-DDTHH:mm"; computed after mount so
	// server and client render the same markup.
	useEffect(() => {
		const toLocal = date => {
			const offset = date.getTimezoneOffset() * 60000;
			return new Date(date.getTime() - offset).toISOString().slice(0, 16);
		};
		const now = new Date();
		const min = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 15 * 60 * 1000);
		min.setMinutes(Math.ceil(min.getMinutes() / 15) * 15, 0, 0);
		const max = oneMonthAfterUtc(now);
		setTimeBounds({ min: toLocal(min), max: toLocal(max) });
	}, []);

	// The widget remounts (new React key) whenever the token is reset, so a
	// stale load-error from a previous mount shouldn't stick around.
	useEffect(() => {
		setRecaptchaError(false);
	}, [form.recaptchaKey]);

	const renderField = field => {
		switch (field) {
			case "name":
				return (
					<div className="col-sm-6">
						<div className="form-input">
							<input
								type="text"
								name="name"
								maxLength={100}
								placeholder={`Full Name${star("name")}`}
								value={form.formData.name}
								onChange={form.handleChange}
								disabled={locked}
							/>
						</div>
					</div>
				);
			case "email":
				return (
					<div className="col-sm-6">
						<div className="form-input">
							<input
								type="email"
								name="email"
								maxLength={254}
								placeholder={`Email Address${star("email")}`}
								value={form.formData.email}
								onChange={form.handleChange}
								disabled={locked}
							/>
						</div>
					</div>
				);
			case "phone":
				return (
					<div className="col-sm-6">
						<div className="form-input">
							<input
								type="tel"
								name="phone"
								inputMode="numeric"
								maxLength={10}
								placeholder={`Phone number${star("phone")}`}
								value={form.formData.phone}
								onChange={form.handleChange}
								disabled={locked}
							/>
						</div>
					</div>
				);
			case "company":
				return (
					<div className="col-sm-6">
						<div className="form-input">
							<input
								type="text"
								name="company"
								maxLength={150}
								placeholder={`Company Name${star("company")}`}
								value={form.formData.company}
								onChange={form.handleChange}
								disabled={locked}
							/>
						</div>
					</div>
				);
			case "topic":
				return (
					<div className="col-sm-6">
						<div
							className="form-input"
							style={locked ? { pointerEvents: "none", opacity: 0.6 } : undefined}
						>
							<div className="tj-nice-select-box">
								<div className="tj-select">
									<ReactNiceSelect
										selectedIndex={0}
										getSelectedOption={form.handleTopicChange}
										options={CONTACT_TOPIC_OPTIONS}
									/>
								</div>
							</div>
						</div>
					</div>
				);
			case "partnershipType":
				return (
					<div className="col-sm-6">
						<div
							className="form-input"
							style={locked ? { pointerEvents: "none", opacity: 0.6 } : undefined}
						>
							<div className="tj-nice-select-box">
								<div className="tj-select">
									<ReactNiceSelect
										selectedIndex={0}
										getSelectedOption={form.handlePartnershipChange}
										options={PARTNERSHIP_OPTIONS}
									/>
								</div>
							</div>
						</div>
					</div>
				);
			case "preferredAt":
				return (
					<div className="col-sm-6">
						<div className="form-input form-input-date">
							{/* Shown as a plain text field (matching the other inputs) until
							    focused or filled, then switched to the native picker. */}
							<input
								id="preferredAt"
								type={dateFocused || form.formData.preferredAt ? "datetime-local" : "text"}
								aria-label="Preferred date and time (optional)"
								placeholder="Preferred date & time (optional)"
								onFocus={e => {
									setDateFocused(true);
									const input = e.currentTarget;
									requestAnimationFrame(() => {
										try {
											input.showPicker?.();
										} catch {}
									});
								}}
								onBlur={() => setDateFocused(false)}
								name="preferredAt"
								min={timeBounds.min}
								max={timeBounds.max}
								value={form.formData.preferredAt}
								onChange={form.handleChange}
								disabled={locked}
							/>
						</div>
					</div>
				);
			case "message":
				return (
					<div className="col-sm-12">
						<div className="form-input message-input">
							<textarea
								name="message"
								maxLength={5000}
								placeholder={`Type message${star("message")}`}
								value={form.formData.message}
								onChange={form.handleChange}
								disabled={locked}
							></textarea>
						</div>
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<div className="row">
			{form.fields.map(field => (
				<Fragment key={field}>{renderField(field)}</Fragment>
			))}

			{locked ? (
				<div className="col-sm-12">
					<p className="mb-2">
						We&apos;ve sent a 6-digit code to <strong>{form.formData.email}</strong>.{" "}
						<button type="button" className="btn btn-link p-0 align-baseline" onClick={form.changeDetails}>
							Change details
						</button>
					</p>
					<div className="form-input">
						<input
							type="text"
							name="otp"
							inputMode="numeric"
							autoComplete="one-time-code"
							maxLength={6}
							placeholder="Enter the OTP sent to your email *"
							value={form.otp}
							onChange={form.handleOtpChange}
							aria-invalid={form.otpError ? "true" : "false"}
							style={form.otpError ? { borderColor: "red" } : undefined}
						/>
						{form.otpError ? (
							<span className="d-block mt-1" style={{ color: "red" }}>
								{form.otpError}
							</span>
						) : null}
					</div>
					<p className="mb-3">
						<button
							type="button"
							className="btn btn-link p-0"
							onClick={form.resendCode}
							disabled={form.resendIn > 0 || form.isResending}
						>
							{form.resendIn > 0 ? `Resend code in ${form.resendIn}s` : "Resend code"}
						</button>
					</p>
					{form.config.recaptchaSiteKey ? (
						<div className="mb-3">
							<Recaptcha
								key={form.recaptchaKey}
								siteKey={form.config.recaptchaSiteKey}
								onChange={form.setRecaptchaToken}
								onError={() => setRecaptchaError(true)}
							/>
							{recaptchaError ? (
								<span className="d-block mt-1" style={{ color: "red" }}>
									Couldn&apos;t load the security check. Please disable content blockers and reload,
									or email us at info@dpdpconsultants.com.
								</span>
							) : null}
						</div>
					) : null}
				</div>
			) : null}

			<div className="submit-btn">
				{locked ? (
					<ButtonPrimary
						type={"button"}
						text={"Proceed"}
						onClick={form.openConsent}
						disabled={!form.canProceed || form.isSubmitting}
					/>
				) : (
					<ButtonPrimary
						type={"submit"}
						text={form.isSubmitting ? "Sending..." : submitText}
						disabled={form.isSubmitting}
					/>
				)}
			</div>

			<ConsentModal
				open={form.consentOpen}
				notices={form.config.notices}
				isSubmitting={form.isSubmitting}
				onAgree={form.agree}
				onClose={form.closeConsent}
			/>
		</div>
	);
};

export default ContactFormBody;
