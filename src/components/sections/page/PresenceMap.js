import { INDIA_COLS, INDIA_DOTS, INDIA_ROWS, NOIDA } from "./indiaDots";

// "Pan India Presence" illustration in the site theme: a dotted map of India
// in the brand gradient on a navy card, a light sweeping across the dots, the
// Noida head office pulsing, and reach lines drawing out from it. All 794
// dots are one SVG path (round-capped zero-length segments), so it stays
// light. Motion is CSS only and stops for reduced-motion visitors.
const CELL = 10;
const PAD = 12;
const WIDTH = INDIA_COLS * CELL + PAD * 2;
const HEIGHT = INDIA_ROWS * CELL + PAD * 2;

const dots = INDIA_DOTS.split(" ").map(entry => entry.split(".").map(part => parseInt(part, 36)));
const at = ([col, row]) => [PAD + col * CELL, PAD + row * CELL];
const DOTS_PATH = dots.map(dot => `M${at(dot).join(" ")}h0`).join("");

// Reach lines fan out from Noida towards the west, south, east and
// north-east of the country (directions only, not office locations). Each
// end snaps to the nearest dot so it lands on the map.
const REACH = [
	[3, 19],
	[7, 27],
	[14, 36],
	[15, 30],
	[29, 22],
	[34, 16],
];
const nearestDot = ([col, row]) =>
	dots.reduce((best, dot) => (Math.hypot(dot[0] - col, dot[1] - row) < Math.hypot(best[0] - col, best[1] - row) ? dot : best));
const HQ = at([NOIDA.col, NOIDA.row]);
const ARCS = REACH.map(target => {
	const [x, y] = at(nearestDot(target));
	const mx = (HQ[0] + x) / 2;
	const my = (HQ[1] + y) / 2 - Math.hypot(x - HQ[0], y - HQ[1]) * 0.28;
	return { d: `M${HQ[0]} ${HQ[1]}Q${mx} ${my} ${x} ${y}`, end: [x, y] };
});
const pct = (value, total) => `${((value / total) * 100).toFixed(2)}%`;

const PresenceMap = () => (
	<div className="page-presence" aria-hidden="true">
		<span className="page-presence-glow glow-1"></span>
		<span className="page-presence-glow glow-2"></span>
		<svg className="page-presence-map" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="presentation">
			<defs>
				<linearGradient id="pm-dots" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="#38bdf8" />
					<stop offset="55%" stopColor="#2563eb" />
					<stop offset="100%" stopColor="#6366f1" />
				</linearGradient>
				<radialGradient id="pm-sweep">
					<stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
					<stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
				</radialGradient>
				<mask id="pm-mask">
					<path d={DOTS_PATH} stroke="#fff" strokeWidth="5" strokeLinecap="round" />
				</mask>
			</defs>
			<path className="page-presence-dots" d={DOTS_PATH} stroke="url(#pm-dots)" strokeWidth="5" strokeLinecap="round" />
			<g mask="url(#pm-mask)">
				<circle className="page-presence-sweep" cx={WIDTH * 0.2} cy={HEIGHT * 0.2} r="110" fill="url(#pm-sweep)" />
			</g>
			{ARCS.map((arc, idx) => (
				<g key={arc.d} style={{ "--i": idx }}>
					<path className="page-presence-arc" d={arc.d} pathLength="1" />
					<circle className="page-presence-end" cx={arc.end[0]} cy={arc.end[1]} r="4" />
				</g>
			))}
			<circle className="page-presence-ring" cx={HQ[0]} cy={HQ[1]} r="9" />
			<circle className="page-presence-ring ring-2" cx={HQ[0]} cy={HQ[1]} r="9" />
			<circle className="page-presence-hq" cx={HQ[0]} cy={HQ[1]} r="6" />
		</svg>
		<span className="page-presence-pin" style={{ left: pct(HQ[0], WIDTH), top: pct(HQ[1], HEIGHT) }}>
			<i className="tji-location"></i>
			Head Office · Noida
		</span>
		<span className="page-presence-chip chip-1">
			<strong>100%</strong> Made in India Technology
		</span>
		<span className="page-presence-chip chip-2">
			<strong>100%</strong> Automated Privacy Tools
		</span>
	</div>
);
export default PresenceMap;
