const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const blogsRouter = require("./routes/blogs");
const contactRouter = require("./routes/contact");
const adminAuthRouter = require("./routes/adminAuth");
const adminBlogsRouter = require("./routes/adminBlogs");
const adminMessagesRouter = require("./routes/adminMessages");
const uploadRouter = require("./routes/upload");
const settingsRouter = require("./routes/settings");
const adminSettingsRouter = require("./routes/adminSettings");

function buildApp() {
	const app = express();

	app.use(
		cors({
			origin: process.env.CORS_ORIGIN || "http://localhost:3001",
			credentials: true,
		})
	);
	app.use(express.json());
	app.use(cookieParser());
	app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

	app.get("/health", (req, res) => res.json({ ok: true }));

	app.use("/api/blogs", blogsRouter);
	app.use("/api/contact", contactRouter);
	app.use("/api/settings", settingsRouter);
	app.use("/api/admin", adminAuthRouter);
	app.use("/api/admin/blogs", adminBlogsRouter);
	app.use("/api/admin/messages", adminMessagesRouter);
	app.use("/api/admin/settings", adminSettingsRouter);
	app.use("/api/admin/upload", uploadRouter);

	app.use((err, req, res, next) => {
		console.error(err);
		res.status(500).json({ message: "Something went wrong." });
	});

	return app;
}

module.exports = buildApp;
