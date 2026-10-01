import { getLogos } from "@/libs/clientLogosApi";
import SectionHeading from "./SectionHeading";

// Scrolling logo strip(s) in full colour; a logo lifts and grows on hover;
// the strip pauses on hover. Logos split evenly into three rows that move in
// alternating directions. `source: "clients"` / `"partners"` loads the logos
// managed in the admin; otherwise `items` lists them in the content file.
const ROW_COUNT = 3;

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
	const logos = source ? await getLogos(source === "partners" ? "partner" : "client") : items || [];
	if (!logos.length) return null;
	const rowCount = Math.min(ROW_COUNT, logos.length);
	const rows = Array.from({ length: rowCount }, (_, idx) =>
		logos.slice(Math.ceil((idx * logos.length) / rowCount), Math.ceil(((idx + 1) * logos.length) / rowCount))
	);
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
