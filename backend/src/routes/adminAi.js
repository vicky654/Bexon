const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.use(requireAdmin);

let client = null;
function getClient() {
	if (!process.env.ANTHROPIC_API_KEY) return null;
	if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
	return client;
}

const SYSTEM_PROMPTS = {
	blog: [
		"You write blog posts for DPDP Consultants, a data privacy and DPDP Act 2023 compliance",
		"consultancy in India. Given a topic, return ONLY a JSON object with keys \"title\",",
		"\"excerpt\", \"content\" - no markdown code fences, no commentary before or after.",
		'"title": a specific, compelling headline (no surrounding quotes).',
		'"excerpt": a 1-2 sentence summary, under 160 characters.',
		'"content": the full post body as clean semantic HTML using only <p>, <h3>, <ul>, <li>,',
		"and <strong> tags - no <html>, <head>, <body>, inline styles, or markdown syntax.",
		"Write 4-6 paragraphs in a professional but approachable tone, with India/DPDP Act",
		"context where relevant. Do not repeat the title as a heading inside content.",
	].join(" "),
	job: [
		"You write job postings for DPDP Consultants, a data privacy and DPDP Act 2023",
		"compliance consultancy in India. Given a role topic, return ONLY a JSON object with",
		'keys "title", "description", "requirements" - no markdown code fences, no commentary.',
		'"title": a concise job title.',
		'"description": 2-4 short paragraphs of plain text (blank line between paragraphs)',
		"describing the role and its responsibilities.",
		'"requirements": plain text, one requirement per line, no bullet characters.',
		"Professional tone.",
	].join(" "),
};

router.post("/generate", async (req, res) => {
	const { type, prompt } = req.body || {};

	if (!SYSTEM_PROMPTS[type]) {
		return res.status(400).json({ message: "type must be 'blog' or 'job'." });
	}

	if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
		return res.status(400).json({ message: "A topic/prompt is required." });
	}

	const anthropic = getClient();
	if (!anthropic) {
		return res.status(503).json({
			message: "AI generation isn't configured. Set ANTHROPIC_API_KEY on the backend to enable it.",
		});
	}

	try {
		const message = await anthropic.messages.create({
			model: "claude-sonnet-5",
			max_tokens: 1500,
			system: SYSTEM_PROMPTS[type],
			messages: [{ role: "user", content: prompt.trim() }],
		});

		const text = message.content?.find(block => block.type === "text")?.text || "";

		let parsed;
		try {
			parsed = JSON.parse(text);
		} catch {
			const match = text.match(/\{[\s\S]*\}/);
			if (match) {
				try {
					parsed = JSON.parse(match[0]);
				} catch {
					parsed = null;
				}
			}
		}

		if (!parsed) {
			throw new Error("Could not parse the AI response.");
		}

		res.json({ result: parsed });
	} catch (error) {
		console.error("AI generation failed:", error.message);
		res.status(502).json({ message: "AI generation failed. Please try again." });
	}
});

module.exports = router;
