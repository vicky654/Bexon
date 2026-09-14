const express = require("express");
const prisma = require("../lib/prisma");
const { sendContactNotification } = require("../lib/mailer");

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/", async (req, res) => {
	const { name, email, phone, service, message } = req.body || {};

	if (!name || !email || !message) {
		return res
			.status(400)
			.json({ message: "Name, email and message are required." });
	}

	if (!emailPattern.test(email)) {
		return res
			.status(400)
			.json({ message: "Please provide a valid email address." });
	}

	const submission = await prisma.contactSubmission.create({
		data: { name, email, phone: phone || "", service: service || "", message },
	});

	try {
		await sendContactNotification({ name, email, phone, service, message });
	} catch (error) {
		console.error("Contact notification email failed to send:", error.message);
	}

	res.status(201).json({ message: "Message sent successfully.", id: submission.id });
});

module.exports = router;
