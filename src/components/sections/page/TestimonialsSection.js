"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import ClampText from "./ClampText";
import SectionHeading from "./SectionHeading";

// Client testimonials on a navy band: one large glass card at a time with the
// company logo, stars, quote and person. Arrows/dots switch quotes; it
// advances every 8s, pausing on hover/focus and for reduced-motion visitors.
const INTERVAL_MS = 8000;

const TestimonialsSection = ({ anchor, eyebrow, heading, intro, items }) => {
	const [active, setActive] = useState(0);
	const [paused, setPaused] = useState(false);
	const reducedMotion = useRef(false);
	const count = items.length;
	const go = useCallback(index => setActive((index + count) % count), [count]);

	useEffect(() => {
		reducedMotion.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
	}, []);
	useEffect(() => {
		if (paused || count < 2 || reducedMotion.current) return;
		const timer = setTimeout(() => go(active + 1), INTERVAL_MS);
		return () => clearTimeout(timer);
	}, [active, paused, count, go]);

	return (
		<section id={anchor} className="tj-page-section section-gap-2 page-testimonials page-section-dark">
			<div className="page-section-dark-bg" aria-hidden="true">
				<span className="page-home-hero-glow glow-1"></span>
				<span className="page-home-hero-glow glow-2"></span>
			</div>
			<div className="container">
				<SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} />
				<div
					className="page-testimonials-stage wow fadeInUp"
					data-wow-delay=".3s"
					role="region"
					aria-roledescription="carousel"
					aria-label={heading}
					onMouseEnter={() => setPaused(true)}
					onMouseLeave={() => setPaused(false)}
					onFocus={() => setPaused(true)}
					onBlur={() => setPaused(false)}
				>
					{items.map((item, idx) => (
						<figure
							key={item.name}
							className={`page-testimonial${idx === active ? " is-active" : ""}`}
							aria-hidden={idx === active ? undefined : "true"}
							aria-roledescription="slide"
							aria-label={`${idx + 1} of ${count}`}
						>
							<span className="page-testimonial-mark" aria-hidden="true">
								&ldquo;
							</span>
							<div className="page-testimonial-person">
								{item.logo ? (
									<span className="page-testimonial-logo">
										<img src={item.logo} alt={item.company || ""} loading="lazy" />
									</span>
								) : null}
								<span className="page-testimonial-stars" aria-label="5 out of 5 stars">
									★★★★★
								</span>
								<figcaption>
									<strong>{item.name}</strong>
									<span>{item.role}</span>
									{item.company ? <span className="page-testimonial-company">{item.company}</span> : null}
								</figcaption>
							</div>
							<blockquote className="page-testimonial-quote">
								<ClampText text={item.quote} lines={6} className="page-testimonial-text" />
							</blockquote>
						</figure>
					))}
				</div>
				{count > 1 ? (
					<div className="page-testimonials-nav">
						<button type="button" className="page-testimonials-arrow" onClick={() => go(active - 1)} aria-label="Previous testimonial">
							<i className="tji-arrow-left" aria-hidden="true"></i>
						</button>
						<div className="page-testimonials-dots">
							{items.map((item, idx) => (
								<button
									type="button"
									key={item.name}
									className={idx === active ? "is-active" : ""}
									onClick={() => go(idx)}
									aria-label={`Show testimonial ${idx + 1}: ${item.company || item.name}`}
									aria-current={idx === active ? "true" : undefined}
								/>
							))}
						</div>
						<button type="button" className="page-testimonials-arrow" onClick={() => go(active + 1)} aria-label="Next testimonial">
							<i className="tji-arrow-right" aria-hidden="true"></i>
						</button>
					</div>
				) : null}
			</div>
		</section>
	);
};
export default TestimonialsSection;
