const nodemailer = require("nodemailer");

async function sendContactNotification({ name, email, phone, service, message }) {
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

	await transporter.sendMail({
		from: `"${name}" <${fromEmail}>`,
		replyTo: email,
		to: toEmail,
		subject: `New contact form submission${service ? ` - ${service}` : ""}`,
		text: [
			`Name: ${name}`,
			`Email: ${email}`,
			phone ? `Phone: ${phone}` : null,
			service ? `Service: ${service}` : null,
			"",
			message,
		]
			.filter(Boolean)
			.join("\n"),
	});
}

module.exports = { sendContactNotification };
