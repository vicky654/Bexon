import { gsap, ScrollTrigger, SplitText } from "@/libs/gsap.config";

const isOnScreen = element => {
	const rect = element.getBoundingClientRect();
	return rect.top < window.innerHeight && rect.bottom > 0;
};

// Section headings reveal word by word as they scroll into view. Splitting
// text into words is the expensive part (it measures every word), so each
// heading is split only when it is about to enter the viewport, not all at
// page load. Headings already on screen stay as they are (they may be the
// page's largest element). Until a heading is revealed, html.page-anim keeps
// it at opacity 0 (see _theme.scss).
const reveal = element => {
	element.classList.add("start-anim");
	const split = new SplitText(element, { type: "words" });
	gsap.from(split.words, { y: "100%", autoAlpha: 0, duration: 0.9, stagger: 0.05, ease: "power3.out" });
};

const titleAnim = () => {
	const elements = gsap.utils.toArray(".title-anim");
	elements.forEach(element => {
		if (isOnScreen(element)) {
			element.classList.add("start-anim");
			return;
		}
		ScrollTrigger.create({ trigger: element, start: "top 92%", once: true, onEnter: () => reveal(element) });
	});
};

export default titleAnim;
