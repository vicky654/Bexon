// Decorative "compliance dashboard" drawn in HTML/CSS for the home hero: a
// readiness ring that fills, checklist rows that tick on one after another,
// and small chips floating around the card. Purely illustrative, so it is
// hidden from assistive technology; all motion is CSS and is switched off for
// visitors who prefer reduced motion (see _page.scss).
const CHECKS = ["Consent notices published", "Data Principal rights portal", "DPIA completed", "Vendor DPAs signed"];

const HeroDashboard = () => (
	<div className="page-hero-dash" aria-hidden="true">
		<div className="page-hero-dash-card">
			<div className="page-hero-dash-head">
				<span className="page-hero-dash-dots">
					<span></span>
					<span></span>
					<span></span>
				</span>
				<span className="page-hero-dash-label">DPDP Compliance Overview</span>
			</div>
			<div className="page-hero-dash-body">
				<div className="page-hero-dash-ring">
					<svg viewBox="0 0 120 120">
						<defs>
							<linearGradient id="dashRing" x1="0" y1="0" x2="1" y2="1">
								<stop offset="0%" stopColor="#38bdf8" />
								<stop offset="100%" stopColor="#6366f1" />
							</linearGradient>
						</defs>
						<circle className="track" cx="60" cy="60" r="50" />
						<circle className="fill" cx="60" cy="60" r="50" />
					</svg>
					<span className="page-hero-dash-ring-text">
						<i className="tji-check"></i>
						<small>Readiness</small>
					</span>
				</div>
				<ul className="page-hero-dash-checks">
					{CHECKS.map(label => (
						<li key={label}>
							<span className="tick">
								<i className="tji-check"></i>
							</span>
							{label}
						</li>
					))}
				</ul>
			</div>
			<div className="page-hero-dash-bars">
				<span style={{ "--h": "45%" }}></span>
				<span style={{ "--h": "70%" }}></span>
				<span style={{ "--h": "55%" }}></span>
				<span style={{ "--h": "85%" }}></span>
				<span style={{ "--h": "65%" }}></span>
				<span style={{ "--h": "95%" }}></span>
			</div>
		</div>
		<span className="page-hero-dash-chip chip-1">
			<i className="tji-support"></i>Consent captured
		</span>
		<span className="page-hero-dash-chip chip-2">
			<i className="tji-chart"></i>Risk tracked
		</span>
		<span className="page-hero-dash-chip chip-3">
			<i className="tji-award"></i>DPDP Act 2023
		</span>
	</div>
);
export default HeroDashboard;
