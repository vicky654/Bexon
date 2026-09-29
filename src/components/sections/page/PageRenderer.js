import CardsLinksSection from "./CardsLinksSection";
import CtaSection from "./CtaSection";
import FaqSection from "./FaqSection";
import FeaturesSection from "./FeaturesSection";
import HomeHeroSection from "./HomeHeroSection";
import RichTextSection from "./RichTextSection";
import SplitSection from "./SplitSection";
import StatsSection from "./StatsSection";
import StepsSection from "./StepsSection";

const COMPONENTS = {
	homeHero: HomeHeroSection,
	richText: RichTextSection,
	features: FeaturesSection,
	split: SplitSection,
	steps: StepsSection,
	stats: StatsSection,
	faq: FaqSection,
	cta: CtaSection,
	cardsLinks: CardsLinksSection,
};

const PageRenderer = ({ sections }) =>
	sections.map((section, idx) => {
		const Component = COMPONENTS[section.type];
		if (!Component) {
			if (process.env.NODE_ENV !== "production") console.warn(`Unknown section type: ${section.type}`);
			return null;
		}
		const { type, ...props } = section;
		return <Component key={`${type}-${idx}`} idPrefix={`s${idx}`} {...props} />;
	});

export default PageRenderer;
