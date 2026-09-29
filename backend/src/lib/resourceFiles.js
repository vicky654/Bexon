const fs = require("fs");
const path = require("path");

const RESOURCE_KEY_PATTERN = /^[0-9]+-[0-9]+\.pdf$/;

function resourceDir() {
	const dir = process.env.RESOURCE_FILES_DIR || path.join(__dirname, "../../private/resources");
	fs.mkdirSync(dir, { recursive: true });
	return dir;
}

function resourcePath(fileKey) {
	if (typeof fileKey !== "string" || !RESOURCE_KEY_PATTERN.test(fileKey)) {
		throw new Error("Invalid resource file key");
	}
	return path.join(resourceDir(), fileKey);
}

function newResourceKey() {
	return `${Date.now()}-${Math.floor(Math.random() * 1e9)}.pdf`;
}

function deleteResourceFile(fileKey) {
	if (!fileKey) return;
	try {
		fs.unlinkSync(resourcePath(fileKey));
	} catch (error) {
		if (error.code !== "ENOENT") console.error("Failed to delete resource file:", error.message);
	}
}

module.exports = { RESOURCE_KEY_PATTERN, resourceDir, resourcePath, newResourceKey, deleteResourceFile };
