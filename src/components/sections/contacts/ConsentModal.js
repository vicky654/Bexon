"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const FALLBACK_NOTICE =
	"<p>By clicking Agree, you consent to DPDP Consultants (Privacyium Tech Pvt. Ltd.) processing your name, email address and phone number to respond to your enquiry, in accordance with the Digital Personal Data Protection Act, 2023.</p>";

// Notice HTML comes from the company's own consent portal, rendered as-is
// just like the old site did.
const ConsentModal = ({ open, notices, isSubmitting, onAgree, onClose }) => {
	const languages = Object.keys(notices || {});
	const defaultLanguage = languages.includes("English") ? "English" : languages[0] || "English";
	const [language, setLanguage] = useState(defaultLanguage);
	const [mounted, setMounted] = useState(false);
	const agreeButtonRef = useRef(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (open) setLanguage(defaultLanguage);
	}, [open, defaultLanguage]);

	// #smooth-content (GSAP ScrollSmoother) and .wow fadeInUp (animate.css) both
	// put a transform on an ancestor, which traps `position: fixed`. The modal
	// is portaled to document.body to escape that, so lock scrolling on the
	// body directly instead of relying on a transformed ancestor's overflow.
	useEffect(() => {
		if (!open) return undefined;
		document.body.classList.add("modal-open");
		document.body.style.overflow = "hidden";
		return () => {
			document.body.classList.remove("modal-open");
			document.body.style.overflow = "";
		};
	}, [open]);

	useEffect(() => {
		if (!open) return undefined;
		const handleKeyDown = e => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [open, onClose]);

	useEffect(() => {
		if (open && mounted) agreeButtonRef.current?.focus();
	}, [open, mounted]);

	if (!open || !mounted) return null;

	return createPortal(
		<div
			className="modal d-block"
			tabIndex="-1"
			role="dialog"
			aria-modal="true"
			aria-labelledby="consent-modal-title"
			style={{ background: "rgba(0, 0, 0, 0.5)" }}
			data-lenis-prevent
		>
			<div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
				<div className="modal-content">
					<div className="modal-header d-flex justify-content-between align-items-center">
						<h5 className="modal-title" id="consent-modal-title">
							Consent Notice
						</h5>
						{languages.length > 1 ? (
							<label className="d-flex align-items-center gap-2 mb-0">
								<span>Language:</span>
								<select
									className="form-select form-select-sm w-auto"
									value={language}
									onChange={e => setLanguage(e.target.value)}
								>
									{languages.map(lang => (
										<option key={lang} value={lang}>
											{lang}
										</option>
									))}
								</select>
							</label>
						) : null}
					</div>
					<div
						className="modal-body"
						dangerouslySetInnerHTML={{ __html: notices?.[language] || FALLBACK_NOTICE }}
					/>
					<div className="modal-footer">
						<button
							ref={agreeButtonRef}
							type="button"
							className="btn btn-primary"
							disabled={isSubmitting}
							onClick={() => onAgree(language)}
						>
							{isSubmitting ? "Submitting..." : "Agree"}
						</button>
						<button type="button" className="btn btn-secondary" onClick={onClose}>
							Close
						</button>
					</div>
				</div>
			</div>
		</div>,
		document.body
	);
};

export default ConsentModal;
