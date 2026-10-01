"use client";
import { useEffect, useId, useRef, useState } from "react";

// Long card text trimmed to `lines` lines with a "Read more" toggle. The text
// is clamped from the first render (no layout jump) but stays in the DOM, so
// screen readers and search engines get all of it. The toggle only appears
// when the text is actually cut off.
export default function ClampText({ text, lines = 4, className = "" }) {
	const ref = useRef(null);
	const id = useId();
	const [isClamped, setIsClamped] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const node = ref.current;
		if (!node || isOpen) return;
		const measure = () => setIsClamped(node.scrollHeight - node.clientHeight > 2);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		return () => observer.disconnect();
	}, [isOpen, text]);

	return (
		<div className="page-clamp">
			<p
				id={id}
				ref={ref}
				className={`${className} page-clamp-text${isOpen ? "" : " is-clamped"}`}
				style={{ "--clamp-lines": lines }}
			>
				{text}
			</p>
			{isClamped || isOpen ? (
				<button
					type="button"
					className={`page-clamp-toggle${isOpen ? " is-open" : ""}`}
					aria-expanded={isOpen}
					aria-controls={id}
					onClick={() => setIsOpen(open => !open)}
				>
					{isOpen ? "Read less" : "Read more"}
					<i className="tji-arrow-down" aria-hidden="true"></i>
				</button>
			) : null}
		</div>
	);
}
