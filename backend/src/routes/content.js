const express = require("express");
const fs = require("fs");
const prisma = require("../lib/prisma");
const { isKind, RESOURCE_TYPES, serializePublic } = require("../lib/contentItems");
const { resourcePath } = require("../lib/resourceFiles");
const { verifyDownloadToken } = require("../lib/downloadTokens");

const router = express.Router();
const PAGE_SIZE = 9;
const EXPIRED_MESSAGE = "This download link has expired. Please request the resource again.";

function eventWindow(when, now) {
	const upcoming = { OR: [{ endsAt: { gte: now } }, { endsAt: null, startsAt: { gte: now } }] };
	const past = { OR: [{ endsAt: { lt: now } }, { endsAt: null, startsAt: { lt: now } }] };
	return when === "past"
		? { where: past, orderBy: [{ startsAt: "desc" }, { id: "desc" }] }
		: { where: upcoming, orderBy: [{ startsAt: "asc" }, { id: "asc" }] };
}

router.get("/", async (req, res) => {
	const { kind } = req.query;
	if (!isKind(kind)) return res.status(400).json({ message: "Unknown content type." });

	const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
	let where = { kind, published: true };
	let orderBy = [{ publishedAt: "desc" }, { id: "desc" }];

	if (kind === "resource" && Object.hasOwn(RESOURCE_TYPES, req.query.resourceType || "")) {
		where.resourceType = req.query.resourceType;
	}
	if (kind === "event") {
		const window = eventWindow(req.query.when, new Date());
		where = { ...where, ...window.where };
		orderBy = window.orderBy;
	}

	const [total, items] = await Promise.all([
		prisma.contentItem.count({ where }),
		prisma.contentItem.findMany({ where, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
	]);
	res.json({ items: items.map(serializePublic), total, page, pageSize: PAGE_SIZE });
});

router.get("/resource/:slug/download", async (req, res) => {
	const item = await prisma.contentItem.findUnique({
		where: { kind_slug: { kind: "resource", slug: req.params.slug } },
	});
	if (!item || !item.published) return res.status(404).json({ message: "Resource not found." });
	if (item.gated && !verifyDownloadToken(req.query.token, item.id)) {
		return res.status(403).json({ message: EXPIRED_MESSAGE });
	}

	let filePath;
	try {
		filePath = resourcePath(item.fileKey);
	} catch {
		filePath = null;
	}
	if (!filePath || !fs.existsSync(filePath)) {
		console.error(`Resource file missing for ${item.slug}: ${item.fileKey}`);
		return res.status(404).json({ message: "This file is no longer available." });
	}

	res.setHeader("Cache-Control", "private, no-store");
	res.download(filePath, `${item.slug}.pdf`, { headers: { "Content-Type": "application/pdf" } });
});

router.get("/:kind/:slug", async (req, res) => {
	const { kind, slug } = req.params;
	if (!isKind(kind)) return res.status(400).json({ message: "Unknown content type." });
	const item = await prisma.contentItem.findUnique({ where: { kind_slug: { kind, slug } } });
	if (!item || !item.published) return res.status(404).json({ message: "Not found." });
	res.json({ item: serializePublic(item) });
});

module.exports = router;
