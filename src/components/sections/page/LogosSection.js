import { getClientLogos } from "@/libs/clientLogosApi";
import SectionHeading from "./SectionHeading";

// Scrolling logo strip(s). Logos show in grey and turn full colour on hover;
// the strip pauses on hover. Long lists split into two rows that move in
// opposite directions. `source: "clients"` loads the logos from the admin.
const SPLIT_AT = 16;

const LogoRow = ({ logos, reverse }) => (
	<div className={`page-logos-row${reverse ? " is-reverse" : ""}`}>
		<div className="page-logos-track">
			{[0, 1].map(copy => (
				<ul className="page-logos-list" aria-hidden={copy === 1 ? "true" : undefined} key={copy}>
					{logos.map((logo, idx) => (
						<li className="page-logo" key={`${idx}-${logo.name}`}>
							<img src={logo.image} alt={copy === 1 ? "" : logo.name} loading="lazy" />
						</li>
					))}
				</ul>
			))}
		</div>
	</div>
);

const LogosSection = async ({ anchor, eyebrow, heading, intro, items, source }) => {
	const logos = source === "clients" ? await getClientLogos() : items || [];
	if (!logos.length) return null;
	const rows = logos.length > SPLIT_AT ? [logos.slice(0, Math.ceil(logos.length / 2)), logos.slice(Math.ceil(logos.length / 2))] : [logos];
	return (
		<section id={anchor} className="tj-page-section section-gap-2 page-logos">
			<div className="container">
				<SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} />
			</div>
			<div className="page-logos-rows wow fadeInUp" data-wow-delay=".3s">
				{rows.map((row, idx) => (
					<LogoRow logos={row} reverse={idx % 2 === 1} key={idx} />
				))}
			</div>
		</section>
	);
};
export default LogosSection;
