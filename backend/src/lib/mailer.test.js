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
