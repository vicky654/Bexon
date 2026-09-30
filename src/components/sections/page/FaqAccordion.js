"use client";
import { useState } from "react";

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
					<div className="accordion-item" key={id}>
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
