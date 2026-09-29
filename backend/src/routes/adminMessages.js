const express = require("express");
const prisma = require("../lib/prisma");
const requireAdmin = require("../middleware/requireAdmin");
const { LEAD_TYPES, PARTNERSHIP_TYPES, isLeadType } = require("../lib/leadTypes");

const router = express.Router();

router.use(requireAdmin);

function typeFilter(query) {
	return isLeadType(query.type) ? { type: query.type } : {};
}

async function typeCounts() {
	const grouped = await prisma.contactSubmission.groupBy({ by: ["type"], _count: { _all: true } });
	const counts = { all: 0 };
	for (const type of Object.keys(LEAD_TYPES)) counts[type] = 0;
	for (const row of grouped) {
		counts[row.type] = row._count._all;
		counts.all += row._count._all;
	}
	return counts;
}

// Leading =, +, -, @, tab or CR make spreadsheets treat a cell as a formula.
function csvCell(value) {
	let cell = value === null || value === undefined ? "" : String(value);
	if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`;
	return /[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

const CSV_COLUMNS = [
	["Received", m => m.createdAt.toISOString()],
	["Type", m => (LEAD_TYPES[m.type] || LEAD_TYPES.contact).label],
	["Name", m => m.name],
	["Email", m => m.email],
	["Phone", m => m.phone],
	["Company", m => m.company],
	["Purpose", m => m.topic],
	["Partnership type", m => PARTNERSHIP_TYPES[m.partnershipType] || ""],
	["Preferred time", m => (m.preferredAt ? m.preferredAt.toISOString() : "")],
	["Message", m => m.message],
	["Consent recorded", m => (m.consentRecorded ? "Yes" : "No")],
	["Language", m => m.language],
	["UTM", m => m.utm],
	["Referrer", m => m.referrer],
];

router.get("/", async (req, res) => {
	const messages = await prisma.contactSubmission.findMany({
		where: typeFilter(req.query),
		orderBy: { createdAt: "desc" },
	});
	res.json({ messages, counts: await typeCounts() });
});

router.get("/export.csv", async (req, res) => {
	const where = typeFilter(req.query);
	const messages = await prisma.contactSubmission.findMany({ where, orderBy: { createdAt: "desc" } });
	const lines = [
		CSV_COLUMNS.map(([heading]) => csvCell(heading)).join(","),
		...messages.map(message => CSV_COLUMNS.map(([, read]) => csvCell(read(message))).join(",")),
	];
	const date = new Date().toISOString().slice(0, 10);
	res.setHeader("Content-Type", "text/csv; charset=utf-8");
	res.setHeader("Content-Disposition", `attachment; filename="dpdp-leads-${where.type || "all"}-${date}.csv"`);
	// BOM so Excel opens the file as UTF-8.
	res.send(`﻿${lines.join("\r\n")}\r\n`);
});

router.patch("/:id", async (req, res) => {
	const id = Number(req.params.id);
	const existing = await prisma.contactSubmission.findUnique({ where: { id } });

	if (!existing) {
		return res.status(404).json({ message: "Submission not found." });
	}

	const { status } = req.body || {};
	const nextStatus = status === "new" ? "new" : "read";

	const message = await prisma.contactSubmission.update({
		where: { id },
		data: { status: nextStatus },
	});

	res.json({ message });
});

module.exports = router;
