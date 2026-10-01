"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import SectionHeading from "./SectionHeading";

// DPDP Act penalty exposure check. Each question maps to one entry of the
// Schedule to the Digital Personal Data Protection Act, 2023 (maximum
// amounts, in crore rupees). Nothing is sent anywhere; it runs in the page.
const SCHEDULE = {
	security: { max: 250, label: "Reasonable security safeguards", ref: "Section 8(5)" },
	breach: { max: 200, label: "Personal data breach notification", ref: "Section 8(6)" },
	children: { max: 200, label: "Additional obligations for children's data", ref: "Section 9" },
	sdf: { max: 150, label: "Significant Data Fiduciary obligations", ref: "Section 10" },
	other: { max: 50, label: "Other provisions (consent, notice, rights, retention…)", ref: "Schedule item 7" },
};

// `when` makes a question apply only if an earlier answer says so.
const QUESTIONS = [
	{ id: "children", text: "Do you process personal data of children (under 18)?", scope: true },
	{ id: "sdf", text: "Has your organisation been (or could it be) notified as a Significant Data Fiduciary?", scope: true },
	{ id: "q-security", text: "Do you have reasonable security safeguards for personal data (encryption, access control, logging)?", item: "security" },
	{ id: "q-breach", text: "Can you notify the Data Protection Board and affected Data Principals of a personal data breach?", item: "breach" },
	{ id: "q-children", text: "Do you obtain verifiable parental consent and avoid tracking and targeted advertising directed at children?", item: "children", when: "children" },
	{ id: "q-sdf", text: "Have you appointed a DPO based in India, an independent data auditor, and do you run periodic DPIAs?", item: "sdf", when: "sdf" },
	{ id: "q-consent", text: "Do you collect valid consent with a clear notice, in English or a language in the Eighth Schedule?", item: "other" },
	{ id: "q-rights", text: "Can Data Principals access, correct and erase their data, withdraw consent, and raise grievances?", item: "other" },
	{ id: "q-retention", text: "Do you erase personal data once the purpose is served, and bind your processors by contract?", item: "other" },
];

const formatCrore = value => `₹${value.toLocaleString("en-IN")} crore`;

const PenaltyCheckSection = ({ anchor, eyebrow, heading, intro }) => {
	const [answers, setAnswers] = useState({});
	const answer = (id, value) => setAnswers(prev => ({ ...prev, [id]: value }));

	const visible = QUESTIONS.filter(q => !q.when || answers[q.when] === true);
	const controls = visible.filter(q => q.item);
	const answered = controls.filter(q => answers[q.id] !== undefined);

	const result = useMemo(() => {
		const gaps = new Set(controls.filter(q => answers[q.id] === false).map(q => q.item));
		const items = [...gaps].map(key => ({ key, ...SCHEDULE[key] }));
		const exposure = items.reduce((sum, item) => sum + item.max, 0);
		const yes = controls.filter(q => answers[q.id] === true).length;
		const score = answered.length ? Math.round((yes / answered.length) * 100) : 0;
		return { items, exposure, score };
	}, [answers, controls, answered.length]);

	const complete = answered.length === controls.length && visible.filter(q => q.scope).every(q => answers[q.id] !== undefined);
	const ring = 2 * Math.PI * 52;

	return (
		<section id={anchor} className="tj-page-section section-gap-2 page-penalty">
			<div className="container">
				<SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} />
				<div className="page-penalty-grid">
					<ol className="page-penalty-questions">
						{visible.map((q, idx) => (
							<li key={q.id} className="page-penalty-q">
								<span className="page-penalty-q-num">{String(idx + 1).padStart(2, "0")}</span>
								<p className="page-penalty-q-text" id={`${q.id}-label`}>
									{q.text}
								</p>
								<div className="page-penalty-q-options" role="radiogroup" aria-labelledby={`${q.id}-label`}>
									{[
										{ value: true, label: "Yes" },
										{ value: false, label: "No" },
									].map(option => (
										<button
											type="button"
											role="radio"
											key={option.label}
											aria-checked={answers[q.id] === option.value}
											className={`page-penalty-opt${answers[q.id] === option.value ? (option.value ? " is-yes" : " is-no") : ""}`}
											onClick={() => answer(q.id, option.value)}
										>
											{option.label}
										</button>
									))}
								</div>
							</li>
						))}
					</ol>

					<aside className="page-penalty-result" aria-live="polite">
						<span className="page-penalty-glow" aria-hidden="true"></span>
						<div className="page-penalty-score">
							<svg viewBox="0 0 120 120" aria-hidden="true">
								<circle className="track" cx="60" cy="60" r="52" />
								<circle className="fill" cx="60" cy="60" r="52" strokeDasharray={ring} strokeDashoffset={ring * (1 - result.score / 100)} />
							</svg>
							<span className="page-penalty-score-text">
								<strong>{answered.length ? `${result.score}%` : "–"}</strong>
								<small>Readiness</small>
							</span>
						</div>
						<p className="page-penalty-label">Maximum penalty exposure</p>
						<p className="page-penalty-amount">{formatCrore(result.exposure)}</p>
						{result.items.length ? (
							<ul className="page-penalty-items">
								{result.items.map(item => (
									<li key={item.key}>
										<span>
											{item.label}
											<small>{item.ref}</small>
										</span>
										<strong>up to {formatCrore(item.max)}</strong>
									</li>
								))}
							</ul>
						) : (
							<p className="page-penalty-empty">
								{answered.length ? "No gaps flagged so far. Keep going to complete the check." : "Answer the questions to see which penalties could apply."}
							</p>
						)}
						<p className="page-penalty-note">
							Amounts are the maximum per breach in the Schedule to the DPDP Act, 2023. The Data Protection Board decides the actual penalty
							considering the nature, gravity and duration of the breach, and other factors in Section 33. This check is indicative and is not legal
							advice.
						</p>
						<Link href="/book-consultation" className="page-penalty-cta">
							{complete && result.items.length ? "Close these gaps with an expert" : "Book a free consultation"}
							<i className="tji-arrow-right-long" aria-hidden="true"></i>
						</Link>
						{answered.length ? (
							<button type="button" className="page-penalty-reset" onClick={() => setAnswers({})}>
								Start again
							</button>
						) : null}
					</aside>
				</div>
			</div>
		</section>
	);
};
export default PenaltyCheckSection;
