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

function clientIp(req) {
	const forwarded = req.get("x-forwarded-for");
	if (forwarded) return forwarded.split(",")[0].trim();
	return req.socket?.remoteAddress || "";
}

// Carried over from the old site: staff test with yopmail or company
// addresses, and those runs shouldn't land in the leads inbox.
function isTestAddress(email) {
	const value = String(email || "").toLowerCase();
	return value.includes("yopmail") || value.includes("dpdpconsultants");
}

function createRateLimiter({ max, windowMs }) {
	const hits = new Map();
	return key => {
		const now = Date.now();
		const recent = (hits.get(key) || []).filter(at => now - at < windowMs);
		if (recent.length >= max) {
			hits.set(key, recent);
			return false;
		}
		recent.push(now);
		hits.set(key, recent);
		return true;
	};
}

module.exports = {
	CONTACT_TOPICS,
	deviceTypeFromUserAgent,
	clientIp,
	isTestAddress,
	createRateLimiter,
};
