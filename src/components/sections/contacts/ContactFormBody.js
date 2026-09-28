"use client";

import { useEffect, useState } from "react";
import ButtonPrimary from "@/components/shared/buttons/ButtonPrimary";
import ReactNiceSelect from "@/components/shared/Inputs/ReactNiceSelect";
import Recaptcha from "@/components/shared/Inputs/Recaptcha";
import ConsentModal from "@/components/sections/contacts/ConsentModal";
import { CONTACT_TOPIC_OPTIONS } from "@/libs/contactTopics";

// Fields + OTP step shared by Contact2 and Contact3. `form` is the return
// value of useContactForm().
const ContactFormBody = ({ form, submitText }) => {
	const locked = form.step === "otp";
	const [recaptchaError, setRecaptchaError] = useState(false);

	// The widget remounts (new React key) whenever the token is reset, so a
	// stale load-error from a previous mount shouldn't stick around.
	useEffect(() => {
		setRecaptchaError(false);
	}, [form.recaptchaKey]);

	return (
		<div className="row">
			<div className="col-sm-6">
				<div className="form-input">
					<input
						type="text"
						name="name"
						maxLength={100}
						placeholder="Full Name *"
						value={form.formData.name}
						onChange={form.handleChange}
						disabled={locked}
					/>
				</div>
			</div>
			<div className="col-sm-6">
				<div className="form-input">
					<input
						type="email"
						name="email"
						maxLength={254}
						placeholder="Email Address *"
						value={form.formData.email}
						onChange={form.handleChange}
						disabled={locked}
					/>
				</div>
			</div>
			<div className="col-sm-6">
				<div className="form-input">
					<input
						type="tel"
						name="phone"
						inputMode="numeric"
						maxLength={10}
						placeholder="Phone number *"
						value={form.formData.phone}
						onChange={form.handleChange}
						disabled={locked}
					/>
				</div>
			</div>
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
			<div className="col-sm-12">
				<div className="form-input message-input">
					<textarea
						name="message"
						maxLength={5000}
						placeholder="Type message *"
						value={form.formData.message}
						onChange={form.handleChange}
						disabled={locked}
					></textarea>
				</div>
			</div>

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
