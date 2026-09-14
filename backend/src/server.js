require("dotenv").config();
const buildApp = require("./app");

const PLACEHOLDER_JWT_SECRET = "replace-with-a-long-random-string";
const PLACEHOLDER_ADMIN_PASSWORD = "change-me-now";

function validateSecretsOrExit() {
	const jwtSecret = process.env.JWT_SECRET;
	if (!jwtSecret || jwtSecret.length < 32 || jwtSecret === PLACEHOLDER_JWT_SECRET) {
		console.error(
			"Refusing to start: JWT_SECRET is missing, too short (< 32 chars), or still set to the .env.example placeholder. Set a long, random JWT_SECRET before starting the backend."
		);
		process.exit(1);
	}

	if (process.env.ADMIN_PASSWORD === PLACEHOLDER_ADMIN_PASSWORD) {
		console.error(
			"Refusing to start: ADMIN_PASSWORD is still set to the .env.example placeholder. Set a real ADMIN_PASSWORD before starting the backend."
		);
		process.exit(1);
	}
}

validateSecretsOrExit();

const app = buildApp();
const port = process.env.PORT || 5000;

app.listen(port, () => {
	console.log(`Backend listening on http://localhost:${port}`);
});
