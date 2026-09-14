function makePath(text) {
	if (!text) return "#";
	const normalized = text.toLowerCase().split("/").join(" ").split("&").join(" ");
	return normalized.split(" ").join("_");
}

module.exports = makePath;
