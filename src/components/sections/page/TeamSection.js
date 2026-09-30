import { delay } from "./animation";
import SectionHeading from "./SectionHeading";

// Photo card per person: the photo zooms gently on hover and a gradient
// band carries the name and role; cards fade up one after another.
const TeamSection = ({ anchor, eyebrow, heading, intro, items }) => (
	<section id={anchor} className="tj-page-section section-gap-2 page-team">
		<div className="container">
			<SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} />
			<div className="row row-gap-4 justify-content-center">
				{items.map((member, idx) => (
					<div className="col-xl-3 col-lg-4 col-6 wow fadeInUp" data-wow-delay={delay(idx % 4)} key={member.name}>
						<figure className="page-team-card">
							<div className="page-team-photo">
								<img src={member.image} alt={member.name} loading="lazy" />
							</div>
							<figcaption className="page-team-info">
								<h3 className="page-team-name">{member.name}</h3>
								<p className="page-team-role">{member.role}</p>
							</figcaption>
						</figure>
					</div>
				))}
			</div>
		</div>
	</section>
);
export default TeamSection;
