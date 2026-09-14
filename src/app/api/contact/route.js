import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(request) {
	const body = await request.json();
	const { name, email, phone, service, message } = body || {};

	if (!name || !email || !message) {
		return NextResponse.json(
			{ message: "Name, email and message are required." },
			{ status: 400 }
		);
	}

	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailPattern.test(email)) {
		return NextResponse.json(
			{ message: "Please provide a valid email address." },
			{ status: 400 }
		);
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

	try {
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

		return NextResponse.json({ message: "Message sent successfully." });
	} catch (error) {
		console.error("Contact form email failed to send:", error);
		return NextResponse.json(
			{ message: "Failed to send message. Please try again later." },
			{ status: 500 }
		);
	}
}
