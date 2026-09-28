"use client";

import { useEffect, useState } from "react";

const FALLBACK_NOTICE =
	"<p>By clicking Agree, you consent to DPDP Consultants (Privacyium Tech Pvt. Ltd.) processing your name, email address and phone number to respond to your enquiry, in accordance with the Digital Personal Data Protection Act, 2023.</p>";

// Notice HTML comes from the company's own consent portal, rendered as-is
// just like the old site did.
const ConsentModal = ({ open, notices, isSubmitting, onAgree, onClose }) => {
	const languages = Object.keys(notices || {});
	const defaultLanguage = languages.includes("English") ? "English" : languages[0] || "English";
	const [language, setLanguage] = useState(defaultLanguage);

	useEffect(() => {
		if (open) setLanguage(defaultLanguage);
	}, [open, defaultLanguage]);

	if (!open) return null;

	return (
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
		</div>
	);
};

export default ConsentModal;
