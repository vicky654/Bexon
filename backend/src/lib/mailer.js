const nodemailer = require("nodemailer");
const { LEAD_TYPES, PARTNERSHIP_TYPES } = require("./leadTypes");

async function sendContactNotification({
	type,
	name,
	email,
	phone,
	company,
	partnershipType,
	preferredAt,
	service,
	topic,
	message,
	language,
	utm,
	referrer,
	device,
	ip,
	consentRecorded,
}) {
	if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
		console.log("SMTP not configured, skipping contact notification email.");
		return;
	}

	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: Number(process.env.SMTP_PORT) || 587,
		secure: process.env.SMTP_SECURE === "true",
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
	});

	const toEmail = process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER;
	const fromEmail = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER;
	const partnershipLabel = Object.hasOwn(PARTNERSHIP_TYPES, partnershipType) ? PARTNERSHIP_TYPES[partnershipType] : null;

	await transporter.sendMail({
		from: `"${name}" <${fromEmail}>`,
		replyTo: email,
		to: toEmail,
		// The newsletter type's "service" is always the literal string
		// "Newsletter", which would just repeat the label, so it's excluded.
		subject: `New ${(LEAD_TYPES[type] || LEAD_TYPES.contact).label} lead${type !== "newsletter" && service ? ` - ${service}` : ""}`,
		text: [
			`Name: ${name}`,
			`Email: ${email}`,
			phone ? `Phone: ${phone}` : null,
			`Type: ${(LEAD_TYPES[type] || LEAD_TYPES.contact).label}`,
			company ? `Company: ${company}` : null,
			partnershipLabel ? `Partnership type: ${partnershipLabel}` : null,
			preferredAt ? `Preferred time: ${new Date(preferredAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST` : null,
			topic ? `Purpose: ${topic}` : null,
			language ? `Consent language: ${language}` : null,
			`Consent recorded in portal: ${consentRecorded ? "Yes" : "No"}`,
			"",
			message,
			"",
			"-",
			utm ? `UTM: ${utm}` : null,
			referrer ? `Referrer: ${referrer}` : null,
			device ? `Device: ${device}` : null,
			ip ? `IP: ${ip}` : null,
		]
			.filter(line => line !== null)
			.join("\n"),
	});
}

async function sendJobApplicationNotification({ job, name, email, phone, coverLetter, resumeUrl }) {
	if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
		console.log("SMTP not configured, skipping job application notification email.");
		return;
	}

	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: Number(process.env.SMTP_PORT) || 587,
		secure: process.env.SMTP_SECURE === "true",
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
	});

	const toEmail = process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER;
	const fromEmail = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER;

	await transporter.sendMail({
		from: `"${name}" <${fromEmail}>`,
		replyTo: email,
		to: toEmail,
		subject: `New job application - ${job?.title || "Untitled role"}`,
		text: [
			`Job: ${job?.title || "Untitled role"}`,
			`Name: ${name}`,
			`Email: ${email}`,
			phone ? `Phone: ${phone}` : null,
			resumeUrl ? `Resume: ${resumeUrl}` : null,
			"",
			coverLetter || "",
		]
			.filter(Boolean)
			.join("\n"),
	});
}

module.exports = { sendContactNotification, sendJobApplicationNotification };
