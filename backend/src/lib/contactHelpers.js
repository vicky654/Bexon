const CONTACT_TOPICS = {
	compliance_evaluation: "Compliance Evaluation & Risk Assessment",
	policy_development: "Assist in Policy Development",
	training_education: "Training & Education Programs for DPDPA Compliance",
	data_audit_analysis: "Comprehensive Data Audit & Analysis",
	incident_response: "Incident Response Planning",
	live_demos: "Live Demonstrations of Compliance Tools",
	gap_assessment: "Gap Assessment Review & Remediation Planning",
	dpo_service: "Data Protection Officer as a Service",
	contract_review: "Contract Review & Data Processing Agreements",
	consulting_advisory: "Consulting, Advisory, and Audit",
};

function deviceTypeFromUserAgent(userAgent = "") {
	const ua = String(userAgent || "").toLowerCase();
	if (ua.includes("ipad") || ua.includes("tablet")) return "Tablet";
	if (ua.includes("mobile")) return "Mobile";
	return "Desktop";
}

// Express derives req.ip from X-Forwarded-For only when the direct caller is
// a trusted proxy (see app.set("trust proxy", ...) in app.js), so this can't
// be spoofed by an untrusted client sending its own fake header.
function clientIp(req) {
	return req.ip || req.socket?.remoteAddress || "";
}

// Carried over from the old site: staff test with yopmail or company
// addresses, and those runs shouldn't land in the leads inbox.
function isTestAddress(email) {
	const value = String(email || "").toLowerCase();
	return value.includes("yopmail") || value.includes("dpdpconsultants");
}

function createRateLimiter({ max, windowMs }) {
	const hits = new Map();
	const allow = key => {
		const now = Date.now();
		const recent = (hits.get(key) || []).filter(at => now - at < windowMs);

		// Delete the key if no recent hits remain
		if (recent.length === 0) {
			hits.delete(key);
		}

		if (recent.length >= max) {
			hits.set(key, recent);
			return false;
		}

		recent.push(now);
		hits.set(key, recent);

		// Sweep the map when size exceeds 1000 to prevent unbounded growth
		if (hits.size > 1000) {
			for (const [k, v] of hits.entries()) {
				const filtered = v.filter(at => now - at < windowMs);
				if (filtered.length === 0) {
					hits.delete(k);
				} else {
					hits.set(k, filtered);
				}
			}
		}

		return true;
	};
	// Expose map size for testing eviction behavior
	allow.size = () => hits.size;
	return allow;
}

module.exports = {
	CONTACT_TOPICS,
	deviceTypeFromUserAgent,
	clientIp,
	isTestAddress,
	createRateLimiter,
};
