"use client";
import { useEffect, useRef, useState } from "react";

// Counts a stat like "500+" or "100%" up from zero the first time it scrolls
// into view. Values without a leading number (e.g. "24x7") are shown as-is,
// as is everything for visitors who prefer reduced motion. The server render
// is the final value, so the number is correct without JavaScript.
function parse(value) {
	const match = /^(\d+)(.*)$/.exec(value);
	return match ? { target: Number(match[1]), suffix: match[2] } : null;
}

export default function StatCounter({ value }) {
	const ref = useRef(null);
	const [shown, setShown] = useState(value);

	useEffect(() => {
		const parsed = parse(value);
		const node = ref.current;
		if (!parsed || !node || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
		setShown(`0${parsed.suffix}`);
		let frame;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				observer.disconnect();
				const start = performance.now();
				const duration = 1800;
				const tick = now => {
					const t = Math.min((now - start) / duration, 1);
					const eased = 1 - Math.pow(1 - t, 3);
					setShown(`${Math.round(parsed.target * eased)}${parsed.suffix}`);
					if (t < 1) frame = requestAnimationFrame(tick);
				};
				frame = requestAnimationFrame(tick);
			},
			{ threshold: 0.4 }
		);
		observer.observe(node);
		return () => {
			observer.disconnect();
			cancelAnimationFrame(frame);
		};
	}, [value]);

	return (
		<span className="page-stat-value" ref={ref}>
			{shown}
		</span>
	);
}
