"use client";
import { useState } from "react";
import { delay } from "./animation";

const FaqAccordion = ({ items, idPrefix }) => {
	const [openIndex, setOpenIndex] = useState(0);

	const handleToggle = idx => {
		setOpenIndex(current => (current === idx ? null : idx));
	};

	return (
		<div className="accordion tj-faq" id={`${idPrefix}-faq`}>
			{items.map((item, idx) => {
				const isOpen = openIndex === idx;
				const id = `${idPrefix}-faq-${idx}`;
				const buttonId = `${id}-title`;
				return (
					<div className="accordion-item wow fadeInUp" data-wow-delay={delay(idx, 0.1, 0.05, 0.5)} key={id}>
						<h3 className="faq-heading">
							<button
								id={buttonId}
								className={`faq-title ${isOpen ? "" : "collapsed"}`}
								type="button"
								aria-expanded={isOpen}
								aria-controls={id}
								onClick={() => handleToggle(idx)}
							>
								{item.question}
							</button>
						</h3>
						<div
							id={id}
							role="region"
							aria-labelledby={buttonId}
							className={`collapse ${isOpen ? "show" : ""}`}
						>
							<div className="accordion-body faq-text" dangerouslySetInnerHTML={{ __html: item.answer }} />
						</div>
					</div>
				);
			})}
		</div>
	);
};
export default FaqAccordion;
