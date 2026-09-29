const test = require("node:test");
const assert = require("node:assert/strict");
const { sendContactNotification } = require("./mailer");

test("does not throw when SMTP is not configured", async () => {
	delete process.env.SMTP_HOST;
	delete process.env.SMTP_USER;

	await assert.doesNotReject(() =>
		sendContactNotification({
			name: "Test User",
			email: "test@example.com",
			message: "Hello",
		})
	);
});

test("a partner lead's subject and body carry the Partnership type line; a newsletter lead's subject has no suffix", async () => {
	process.env.SMTP_HOST = "smtp.example.com";
	process.env.SMTP_USER = "sender@example.com";
	const nodemailer = require("nodemailer");
	const originalCreateTransport = nodemailer.createTransport;
	const sent = [];
	nodemailer.createTransport = () => ({
		sendMail: async mail => {
			sent.push(mail);
		},
	});

	try {
		await sendContactNotification({
			type: "partner",
			name: "Meera",
			email: "meera@example.com",
			phone: "9000000001",
			company: "Integrator Co",
			partnershipType: "technology",
			service: "Technology Integration",
			topic: null,
			message: "We'd like to integrate.",
		});
		await sendContactNotification({
			type: "newsletter",
			name: "Sam",
			email: "sam@example.com",
			phone: "9000000002",
			service: "Newsletter",
			topic: null,
			message: "",
		});

		assert.equal(sent[0].subject, "New Partner lead - Technology Integration");
		assert.match(sent[0].text, /Partnership type: Technology Integration/);
		assert.doesNotMatch(sent[0].text, /Purpose:/);

		assert.equal(sent[1].subject, "New Newsletter lead");
		assert.doesNotMatch(sent[1].text, /Partnership type:/);
	} finally {
		nodemailer.createTransport = originalCreateTransport;
		delete process.env.SMTP_HOST;
		delete process.env.SMTP_USER;
	}
});
