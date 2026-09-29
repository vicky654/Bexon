const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const mailer = require("../lib/mailer");
const consentPortal = require("../lib/consentPortal");
const recaptcha = require("../lib/recaptcha");
const {
	CONTACT_TOPICS,
	deviceTypeFromUserAgent,
	clientIp,
	isTestAddress,
	createRateLimiter,
} = require("../lib/contactHelpers");
const { LEAD_TYPES, PARTNERSHIP_TYPES, isLeadType, validateLead, normalizeLead } = require("../lib/leadTypes");
const { signDownloadToken } = require("../lib/downloadTokens");

const router = express.Router();

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_WAIT_MS = 30 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const DEFAULT_LANGUAGE = "English";

const PORTAL_DOWN_MESSAGE =
	"We couldn't send a verification code right now. Please try again, or email us at info@dpdpconsultants.com.";
const EXPIRED_MESSAGE = "This verification has expired. Please submit the form again.";

// Every /start and /resend makes the portal email someone, so cap how often
// one IP can trigger that.
const sendLimiter = createRateLimiter({ max: 5, windowMs: 10 * 60 * 1000 });

// X-Forwarded-For is easy to spoof (a fresh fake IP on every request), so
// also cap how often one inbox can be sent codes, regardless of IP.
const emailSendLimiter = createRateLimiter({ max: 5, windowMs: 10 * 60 * 1000 });

// Circuit breaker shared by /start and /resend: a hard ceiling on portal OTP
// sends across all visitors, in case the per-IP/per-email limiters are
// evaded at scale (e.g. spoofed IPs with distinct throwaway emails).
const GLOBAL_SEND_CAP = Number(process.env.CONTACT_GLOBAL_SEND_CAP) || 100;
const globalSendLimiter = createRateLimiter({ max: GLOBAL_SEND_CAP, windowMs: 60 * 60 * 1000 });

function departmentFor(type) {
	return LEAD_TYPES[isLeadType(type) ? type : "contact"].department;
}

function text(value) {
	return typeof value === "string" ? value.trim() : "";
}

function readLead(body) {
	const tracking = body.tracking && typeof body.tracking === "object" ? body.tracking : {};
	return {
		type: text(body.type) || "contact",
		name: text(body.name),
		email: text(body.email).toLowerCase(),
		phone: text(body.phone),
		company: text(body.company),
		topic: text(body.topic),
		partnershipType: text(body.partnershipType),
		preferredAt: text(body.preferredAt),
		message: text(body.message),
		contentId: body.contentId,
		utm: text(tracking.utm).slice(0, 500),
		referrer: text(tracking.referrer).slice(0, 500),
	};
}

// Resolves and checks the content item a webinar/resource lead refers to.
// Returns { item } or { error }.
async function resolveContent(lead) {
	const contentKind = LEAD_TYPES[lead.type].contentKind;
	if (!contentKind) return {};
	const id = Number(lead.contentId);
	const item = Number.isInteger(id) ? await prisma.contentItem.findUnique({ where: { id } }) : null;
	if (!item || !item.published || item.kind !== contentKind) {
		return { error: "This item is no longer available." };
	}
	if (contentKind === "event" && item.startsAt <= new Date()) {
		return { error: "Registration for this event has closed." };
	}
	if (contentKind === "resource" && (!item.gated || !item.fileKey)) {
		return { error: "This resource isn't available for download." };
	}
	return { item };
}

async function completionBody(lead) {
	if (lead.type !== "resource") return { done: true };
	const item = await prisma.contentItem.findUnique({ where: { id: lead.contentId } });
	if (!item || !item.published) return { done: true };
	return { done: true, downloadUrl: `/api/content/resource/${item.slug}/download?token=${signDownloadToken(item.id)}` };
}

async function requestOtp(lead) {
	const result = await consentPortal.createConsent({
		name: lead.name,
		email: lead.email,
		phone: lead.phone,
		ipaddress: lead.ip,
		department: departmentFor(lead.type),
		devicetype: lead.device,
		language: DEFAULT_LANGUAGE,
	});
	const otp = result?.otp;
	if (otp === undefined || otp === null || String(otp).trim() === "") {
		throw new Error("Consent portal response did not include an otp");
	}
	return String(otp).trim();
}

async function saveLead(lead, { language, consentRecorded }) {
	if (isTestAddress(lead.email)) {
		console.log(`Skipping save for test address ${lead.email}.`);
		return;
	}

	const topicLabel = Object.hasOwn(CONTACT_TOPICS, lead.topic) ? CONTACT_TOPICS[lead.topic] : null;
	const serviceLabel =
		lead.type === "partner"
			? Object.hasOwn(PARTNERSHIP_TYPES, lead.partnershipType)
				? PARTNERSHIP_TYPES[lead.partnershipType]
				: null
			: lead.type === "newsletter"
				? "Newsletter"
				: lead.type === "webinar" || lead.type === "resource"
					? lead.contentTitle
					: topicLabel;
	const data = {
		type: lead.type,
		name: lead.name,
		email: lead.email,
		phone: lead.phone,
		company: lead.company || null,
		partnershipType: lead.partnershipType || null,
		preferredAt: lead.preferredAt || null,
		service: serviceLabel,
		topic: topicLabel,
		message: lead.message,
		language,
		utm: lead.utm,
		referrer: lead.referrer,
		device: lead.device,
		ip: lead.ip,
		consentRecorded,
		contentId: lead.contentId || null,
		contentTitle: lead.contentTitle || null,
	};
	await prisma.contactSubmission.create({ data });

	try {
		await mailer.sendContactNotification(data);
	} catch (error) {
		console.error("Contact notification email failed to send:", error.message);
	}
}

async function findActiveVerification(id) {
	if (typeof id !== "string" || !id) return null;
	const verification = await prisma.contactVerification.findUnique({ where: { id } });
	if (!verification) return null;
	if (verification.expiresAt < new Date()) {
		await prisma.contactVerification.deleteMany({ where: { id } });
		return null;
	}
	return verification;
}

function leadFromVerification(verification) {
	return { ...verification, ...JSON.parse(verification.tracking) };
}

router.get("/config", async (req, res) => {
	const verification = consentPortal.isConfigured();
	let notices = {};
	if (verification) {
		try {
			notices = await consentPortal.getConsentNotices(departmentFor(req.query.type));
		} catch (error) {
			console.error("Failed to load consent notices from the portal:", error.message);
		}
	}
	res.json({ verification, recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || "", notices });
});

router.post("/start", async (req, res) => {
	const raw = readLead(req.body || {});
	if (!isLeadType(raw.type)) return res.status(400).json({ message: "Unknown form type." });
	const error = validateLead(raw.type, raw);
	if (error) return res.status(400).json({ message: error });
	const lead = normalizeLead(raw.type, raw);

	lead.ip = clientIp(req);
	lead.device = deviceTypeFromUserAgent(req.get("user-agent"));

	const { item, error: contentError } = await resolveContent(lead);
	if (contentError) return res.status(400).json({ message: contentError });
	lead.contentId = item ? item.id : null;
	lead.contentTitle = item ? item.title : null;

	if (!sendLimiter(lead.ip)) {
		return res.status(429).json({ message: "Too many attempts. Please wait a few minutes and try again." });
	}
	if (!emailSendLimiter(lead.email)) {
		return res.status(429).json({ message: "Too many attempts. Please wait a few minutes and try again." });
	}

	if (!consentPortal.isConfigured()) {
		console.warn("Consent portal not configured, saving contact submission without OTP verification.");
		await saveLead(lead, { language: "", consentRecorded: false });
		return res.status(201).json(await completionBody(lead));
	}

	await prisma.contactVerification.deleteMany({ where: { expiresAt: { lt: new Date() } } });

	if (!globalSendLimiter("all")) {
		console.warn("Global OTP send cap reached; refusing to send more codes this hour.");
		return res.status(429).json({ message: PORTAL_DOWN_MESSAGE });
	}

	let otp;
	try {
		otp = await requestOtp(lead);
	} catch (portalError) {
		console.error("Consent portal failed to send an OTP:", portalError.message);
		return res.status(502).json({ message: PORTAL_DOWN_MESSAGE });
	}

	const verification = await prisma.contactVerification.create({
		data: {
			type: lead.type,
			company: lead.company || null,
			partnershipType: lead.partnershipType || null,
			preferredAt: lead.preferredAt,
			contentId: lead.contentId,
			contentTitle: lead.contentTitle,
			name: lead.name,
			email: lead.email,
			phone: lead.phone,
			topic: lead.topic,
			message: lead.message,
			tracking: JSON.stringify({ utm: lead.utm, referrer: lead.referrer, device: lead.device, ip: lead.ip }),
			otpHash: await bcrypt.hash(otp, 10),
			expiresAt: new Date(Date.now() + OTP_TTL_MS),
		},
	});

	res.status(201).json({ verificationId: verification.id });
});

router.post("/resend", async (req, res) => {
	const verification = await findActiveVerification(req.body?.verificationId);
	if (!verification) return res.status(410).json({ message: EXPIRED_MESSAGE });

	if (Date.now() - verification.lastSentAt.getTime() < RESEND_WAIT_MS) {
		return res.status(429).json({ message: "Please wait a few seconds before requesting another code." });
	}
	if (!sendLimiter(clientIp(req))) {
		return res.status(429).json({ message: "Too many attempts. Please wait a few minutes and try again." });
	}
	if (!emailSendLimiter(verification.email)) {
		return res.status(429).json({ message: "Too many attempts. Please wait a few minutes and try again." });
	}
	if (!globalSendLimiter("all")) {
		console.warn("Global OTP send cap reached; refusing to send more codes this hour.");
		return res.status(429).json({ message: PORTAL_DOWN_MESSAGE });
	}

	let otp;
	try {
		otp = await requestOtp(leadFromVerification(verification));
	} catch (portalError) {
		console.error("Consent portal failed to resend an OTP:", portalError.message);
		return res.status(502).json({ message: PORTAL_DOWN_MESSAGE });
	}

	const updated = await prisma.contactVerification.updateMany({
		where: { id: verification.id },
		data: {
			otpHash: await bcrypt.hash(otp, 10),
			attempts: 0,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() + OTP_TTL_MS),
		},
	});
	if (updated.count === 0) return res.status(410).json({ message: EXPIRED_MESSAGE });

	res.json({ ok: true });
});

router.post("/verify", async (req, res) => {
	const body = req.body || {};
	const verification = await findActiveVerification(body.verificationId);
	if (!verification) return res.status(410).json({ message: EXPIRED_MESSAGE });

	const tooMany = { message: "Too many incorrect codes. Please submit the form again." };

	if (!(await recaptcha.verifyRecaptcha(text(body.recaptchaToken), clientIp(req)))) {
		return res.status(400).json({ message: "Please complete the reCAPTCHA check.", field: "recaptcha" });
	}

	// Reserve an attempt atomically, before comparing the code, so concurrent
	// guesses can't all read the same pre-increment attempts count and win
	// after more than MAX_OTP_ATTEMPTS tries.
	const reserved = await prisma.contactVerification.updateMany({
		where: { id: verification.id, attempts: { lt: MAX_OTP_ATTEMPTS }, expiresAt: { gt: new Date() } },
		data: { attempts: { increment: 1 } },
	});
	if (reserved.count === 0) {
		await prisma.contactVerification.deleteMany({ where: { id: verification.id } });
		return res.status(429).json(tooMany);
	}

	const code = text(body.otp);
	const matches = /^\d{4,8}$/.test(code) && (await bcrypt.compare(code, verification.otpHash));
	if (!matches) {
		const current = await prisma.contactVerification.findUnique({ where: { id: verification.id } });
		if (!current || current.attempts >= MAX_OTP_ATTEMPTS) {
			await prisma.contactVerification.deleteMany({ where: { id: verification.id } });
			return res.status(429).json(tooMany);
		}
		return res.status(400).json({ message: "Invalid OTP", field: "otp" });
	}

	// Deleting first claims the verification, so a double-submitted Agree
	// can't save the same lead twice.
	const claimed = await prisma.contactVerification.deleteMany({ where: { id: verification.id } });
	if (claimed.count === 0) return res.status(410).json({ message: EXPIRED_MESSAGE });

	const lead = leadFromVerification(verification);
	const language = text(body.language) || DEFAULT_LANGUAGE;

	let consentRecorded = false;
	try {
		await consentPortal.createConsent({
			name: lead.name,
			email: lead.email,
			phone: lead.phone,
			ipaddress: lead.ip,
			department: departmentFor(lead.type),
			devicetype: lead.device,
			language,
			otp: code,
		});
		consentRecorded = true;
	} catch (portalError) {
		console.error("Consent portal failed to record consent:", portalError.message);
	}

	await saveLead(lead, { language, consentRecorded });
	res.json(await completionBody(lead));
});

module.exports = router;
