import { gsap, ScrollSmoother } from "@/libs/gsap.config";

const initSmoothScroller = contanerRef => {
	const animItems = gsap.utils.toArray("#smooth-wrapper");
	// Native scrolling on phones, tablets and narrow windows: smooth-scroll costs
	// the most there and adds little.
	const touchOrNarrow = window.matchMedia?.("(pointer: coarse)").matches || window.innerWidth < 992;
	if (animItems.length && !touchOrNarrow) {
		gsap.config({
			nullTargetWarn: false,
		});

		let smoother = ScrollSmoother.create({
			content: "#smooth-content",
			wrapper: "#smooth-wrapper",
			smooth: 1.1,
			effects: true,
			smoothTouch: 0.1,
			ignoreMobileResize: true,
		});
	}
};

export default initSmoothScroller;
