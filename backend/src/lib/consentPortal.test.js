const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const consentPortal = require("./consentPortal");

const ENV = {
	CONSENT_API_BASE: "https://portal.example.com/",
	CONSENT_JWT_SECRET: "test-secret",
	CONSENT_JWT_ISS: "https://iss.example.com",
	CONSENT_JWT_AUD: "https://aud.example.com",
	CONSENT_JWT_EMAIL: "owner@example.com",
};

function withEnv(fn) {
	return async () => {
		Object.assign(process.env, ENV);
		const originalFetch = global.fetch;
		consentPortal._clearNoticeCache();
		try {
			await fn();
		} finally {
			global.fetch = originalFetch;
			for (const key of Object.keys(ENV)) delete process.env[key];
		}
	};
}

function jsonResponse(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

test("isConfigured is false without base URL or secret", () => {
	delete process.env.CONSENT_API_BASE;
	delete process.env.CONSENT_JWT_SECRET;
	assert.equal(consentPortal.isConfigured(), false);
});

test(
	"buildToken signs exactly iss/aud/email/expiry with HS256",
	withEnv(async () => {
		const decoded = jwt.verify(consentPortal.buildToken(), "test-secret", {
			algorithms: ["HS256"],
			audience: ENV.CONSENT_JWT_AUD,
			issuer: ENV.CONSENT_JWT_ISS,
		});
		assert.deepEqual(Object.keys(decoded).sort(), ["aud", "email", "expiry", "iss"]);
		assert.equal(decoded.email, "owner@example.com");
		const now = Math.floor(Date.now() / 1000);
		assert.ok(decoded.expiry > now + 3500 && decoded.expiry <= now + 3600);
	})
);

test(
	"createConsent posts a form with bearer token and returns the JSON",
	withEnv(async () => {
		let captured;
		global.fetch = async (url, init) => {
			captured = { url, init };
			return jsonResponse({ otp: "123456" });
		};

		const result = await consentPortal.createConsent({
			name: "Jane",
			email: "jane@example.com",
			phone: "9876543210",
			ipaddress: "1.2.3.4",
			department: "Contact Us",
			devicetype: "Desktop",
			language: "English",
		});

		assert.deepEqual(result, { otp: "123456" });
		assert.equal(captured.url, "https://portal.example.com/api/v2/create_consent");
		assert.equal(captured.init.method, "POST");
		assert.match(captured.init.headers.Authorization, /^Bearer /);
		const form = new URLSearchParams(captured.init.body.toString());
		assert.equal(form.get("email"), "jane@example.com");
		assert.equal(form.get("department"), "Contact Us");
		assert.equal(form.get("digi_type"), "parent");
		assert.equal(form.has("otp"), false);
	})
);

test(
	"createConsent includes the otp when given",
	withEnv(async () => {
		let body;
		global.fetch = async (url, init) => {
			body = new URLSearchParams(init.body.toString());
			return jsonResponse({ status: "Success" });
		};
		await consentPortal.createConsent({
			name: "Jane",
			email: "jane@example.com",
			phone: "9876543210",
			ipaddress: "1.2.3.4",
			department: "Contact Us",
			devicetype: "Desktop",
			language: "Hindi",
			otp: "654321",
		});
		assert.equal(body.get("otp"), "654321");
		assert.equal(body.get("language"), "Hindi");
	})
);

test(
	"createConsent throws on a non-2xx response",
	withEnv(async () => {
		global.fetch = async () => jsonResponse({ message: "nope" }, 401);
		await assert.rejects(() =>
			consentPortal.createConsent({ name: "a", email: "a@b.co", phone: "1", ipaddress: "", department: "x", devicetype: "" })
		);
	})
);

test(
	"createConsent throws when a 200 response is not JSON",
	withEnv(async () => {
		global.fetch = async () => new Response("<html>Server error</html>", { status: 200 });
		await assert.rejects(() =>
			consentPortal.createConsent({ name: "a", email: "a@b.co", phone: "1", ipaddress: "", department: "x", devicetype: "" })
		);
	})
);

test(
	"getConsentNotices maps languages to content and caches per department",
	withEnv(async () => {
		let calls = 0;
		let requestedUrl;
		global.fetch = async url => {
			calls += 1;
			requestedUrl = url;
			return jsonResponse({
				status: "Success",
				data: {
					English: { content: "<p>English notice</p>" },
					Hindi: { content: "<p>Hindi notice</p>" },
				},
			});
		};

		const first = await consentPortal.getConsentNotices("Contact Us");
		const second = await consentPortal.getConsentNotices("Contact Us");

		assert.deepEqual(first, { English: "<p>English notice</p>", Hindi: "<p>Hindi notice</p>" });
		assert.deepEqual(second, first);
		assert.equal(calls, 1);
		assert.equal(
			requestedUrl,
			"https://portal.example.com/api/v2/get/template_details?department_name=Contact+Us"
		);
	})
);

test(
	"getConsentNotices throws when the portal does not report Success",
	withEnv(async () => {
		global.fetch = async () => jsonResponse({ status: "Failed" });
		await assert.rejects(() => consentPortal.getConsentNotices("Contact Us"));
	})
);
