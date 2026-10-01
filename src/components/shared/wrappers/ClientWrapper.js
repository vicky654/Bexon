"use client";
import animateInvertText from "@/libs/animateInvertText";
import arrangeAnim from "@/libs/arrangeAnim";
import arrangeAnim2 from "@/libs/arrangeAnim2";
import fadeInRightOnScrollAnim from "@/libs/fadeInRightOnScrollAnim";
import { useGSAP } from "@/libs/gsap.config";
import initSmoothScroller from "@/libs/initSmoothScroller";
import onePageNavAnim from "@/libs/onePageNavAnim";
import progressBar from "@/libs/progressBar";
import sidebarSticky from "@/libs/sidebarSticky";
import smoothScrollToTop from "@/libs/smoothScrollToTop";
import textReavealAnim from "@/libs/textReavealAnim";
import titleAnim from "@/libs/titleAnim";
import titleAnim2 from "@/libs/titleAnim2";
import titleAnim3 from "@/libs/titleAnim3";
import tjImageParallex from "@/libs/tjImageParallex";
import tjLeftSwipeAnimation from "@/libs/tjLeftSwipeAnimation";
import tjMagicCursorAnimation from "@/libs/tjMagicCursorAnimation";
import tjProgressAnimation from "@/libs/tjProgressAnimation";
import tjRightSwipeAnimation from "@/libs/tjRightSwipeAnimation";
import tjScrollSlider from "@/libs/tjScrollSlider";
import tjStackAnimation from "@/libs/tjStackAnimation";
import tjStackAnimation2 from "@/libs/tjStackAnimation2";
import tjStackAnimation3 from "@/libs/tjStackAnimation3";
import tjZoomInScroll from "@/libs/tjZoomInScroll";
import { useEffect, useState } from "react";

// Visitors who ask their device to reduce motion get a static page: no scroll
// reveals, smooth scrolling or cursor effects (CSS in _page.scss shows the
// .wow elements in place).
const prefersReducedMotion = () =>
	typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// wow.js listens for animationend on each .wow element and rewrites
// event.target.className as a string. The event also bubbles up from animated
// children (e.g. the home hero dashboard's SVG ring), whose className is an
// SVGAnimatedString, so wow.js crashed with "className.replace is not a
// function". Only let an element's own animation end reach wow.js.
const WOW_END_EVENTS = ["animationend", "webkitAnimationEnd"];
const keepAnimationEndOnWowElement = event => {
	if (!event.target?.classList?.contains("wow")) event.stopPropagation();
};

const isOnScreen = element => {
	const rect = element.getBoundingClientRect();
	return rect.top < window.innerHeight && rect.bottom > 0;
};

// Animations start only after the page has loaded and the browser is idle, so
// they don't hold up the first paint or the largest element. Content already
// on screen at that moment stays as it is (no flicker); scroll reveals apply
// to the rest. html.page-anim turns the reveal CSS on (see _theme.scss).
function whenIdleAfterLoad(callback) {
	let idleId = null;
	let timeoutId = null;
	const schedule = () => {
		if ("requestIdleCallback" in window) idleId = window.requestIdleCallback(callback, { timeout: 1500 });
		else timeoutId = window.setTimeout(callback, 200);
	};
	if (document.readyState === "complete") schedule();
	else window.addEventListener("load", schedule, { once: true });
	return () => {
		window.removeEventListener("load", schedule);
		if (idleId !== null) window.cancelIdleCallback?.(idleId);
		if (timeoutId !== null) window.clearTimeout(timeoutId);
	};
}

const ClientWrapper = () => {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		if (prefersReducedMotion()) return;
		const cancel = whenIdleAfterLoad(() => {
			document.querySelectorAll(".wow").forEach(element => {
				if (isOnScreen(element)) element.classList.remove("wow");
			});
			document.querySelectorAll(".title-anim, .text-anim, .hero-text-anim").forEach(element => {
				if (isOnScreen(element)) element.classList.add("start-anim");
			});
			document.documentElement.classList.add("page-anim");
			setReady(true);
		});
		return () => {
			cancel();
			document.documentElement.classList.remove("page-anim");
		};
	}, []);

	useEffect(() => {
		if (!ready) return;
		WOW_END_EVENTS.forEach(type => document.addEventListener(type, keepAnimationEndOnWowElement, true));
		import("wow.js").then(({ default: WOW }) => {
			new WOW().init();
		});
		smoothScrollToTop();
		const cleanup = tjMagicCursorAnimation();
		return () => {
			WOW_END_EVENTS.forEach(type => document.removeEventListener(type, keepAnimationEndOnWowElement, true));
			if (cleanup) cleanup();
		};
	}, [ready]);
	useGSAP(
		(context, contextSafe) => {
			if (prefersReducedMotion()) {
				sidebarSticky();
				onePageNavAnim(contextSafe);
				return;
			}
			if (!ready) return;
			// Each initialiser runs in its own short task (yielding to the browser
			// in between) instead of one long block, so the page stays responsive.
			const steps = [
				() => initSmoothScroller(),
				() => tjRightSwipeAnimation(),
				() => tjLeftSwipeAnimation(),
				() => titleAnim(),
				() => titleAnim2(),
				() => titleAnim3(),
				() => textReavealAnim(),
				() => sidebarSticky(),
				() => arrangeAnim(),
				() => arrangeAnim2(),
				() => animateInvertText(),
				() => fadeInRightOnScrollAnim(),
				() => onePageNavAnim(contextSafe),
				() => progressBar(),
				() => tjStackAnimation(),
				() => tjScrollSlider(),
				() => tjStackAnimation2(),
				() => tjImageParallex(),
				() => tjProgressAnimation(),
				() => tjZoomInScroll(),
				() => tjStackAnimation3(),
			];
			let timer = null;
			const runNext = () => {
				const step = steps.shift();
				if (!step) return;
				context.add(step);
				timer = setTimeout(runNext, 0);
			};
			runNext();
			return () => clearTimeout(timer);
		},
		{ dependencies: [ready] }
	);
	return null;
};

export default ClientWrapper;
