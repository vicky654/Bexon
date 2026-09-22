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
const brandLogosRouter = require("./routes/brandLogos");
const adminBrandLogosRouter = require("./routes/adminBrandLogos");

function buildApp() {
	const app = express();

	const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3001,http://localhost:4000")
		.split(",")
		.map(origin => origin.trim())
		.filter(Boolean);

	app.use(
		cors({
			origin: allowedOrigins,
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
	app.use("/api/brand-logos", brandLogosRouter);
	app.use("/api/admin/brand-logos", adminBrandLogosRouter);

	app.use((err, req, res, next) => {
		console.error(err);
		res.status(500).json({ message: "Something went wrong." });
	});

	return app;
}

module.exports = buildApp;
