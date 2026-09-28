const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const requireAdmin = require("../middleware/requireAdmin");
const { PALETTE_KEYS, checkPalette } = require("../lib/colorContrast");

const router = express.Router();

router.use(requireAdmin);

let client = null;
// undefined = use the real client; tests set a stub (or null for "not configured").
let clientOverride;
function getClient() {
	if (clientOverride !== undefined) return clientOverride;
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

const COLOR_SYSTEM_PROMPT = [
	"You design website color palettes for DPDP Consultants, a data privacy and DPDP Act",
	"compliance consultancy in India. Given a mood or description, return a palette as JSON.",
	"primaryColor: main brand color for buttons and highlights; buttons show white text on it.",
	"secondaryColor: dark accent for footers and dark sections; they show white text on it.",
	"hoverColor: button/link hover state, related to primaryColor; it also shows white text.",
	"textColor: body text on backgroundColor. headingColor: headings on backgroundColor.",
	"backgroundColor: base background for light sections.",
	"Every color is a 6-digit hex like #1a2b3c. Text and headings need a WCAG contrast ratio",
	"of at least 4.5 against backgroundColor, and primaryColor, hoverColor and secondaryColor",
	"need at least 4.5 against white. Keep it professional and cohesive.",
].join(" ");

const PALETTE_SCHEMA = {
	type: "object",
	properties: Object.fromEntries(PALETTE_KEYS.map(key => [key, { type: "string" }])),
	required: PALETTE_KEYS,
	additionalProperties: false,
};

const MAX_COLOR_PROMPT_LENGTH = 300;

class RefusalError extends Error {}

async function requestPalette(anthropic, messages) {
	const message = await anthropic.beta.messages.create({
		model: "claude-opus-5",
		max_tokens: 4096,
		betas: ["server-side-fallback-2026-07-01"],
		fallbacks: "default",
		output_config: { effort: "low", format: { type: "json_schema", schema: PALETTE_SCHEMA } },
		system: COLOR_SYSTEM_PROMPT,
		messages,
	});

	if (message.stop_reason === "refusal") throw new RefusalError("The AI declined this request.");

	const text = message.content?.find(block => block.type === "text")?.text || "";
	let palette = null;
	try {
		palette = JSON.parse(text);
	} catch {
		palette = null;
	}
	return { text, palette };
}

router.post("/colors", async (req, res) => {
	const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
	if (!prompt) {
		return res.status(400).json({ message: "Describe the look you want first." });
	}
	if (prompt.length > MAX_COLOR_PROMPT_LENGTH) {
		return res.status(400).json({ message: `Keep the description under ${MAX_COLOR_PROMPT_LENGTH} characters.` });
	}

	const anthropic = getClient();
	if (!anthropic) {
		return res.status(503).json({
			message: "AI generation isn't configured. Set ANTHROPIC_API_KEY on the backend to enable it.",
		});
	}

	const messages = [{ role: "user", content: `Design a palette for: ${prompt}` }];

	try {
		const first = await requestPalette(anthropic, messages);
		const firstCheck = checkPalette(first.palette);
		if (firstCheck.ok) return res.json({ palette: pickPalette(first.palette) });

		// One retry, telling the model exactly which pairs weren't readable.
		const retry = await requestPalette(anthropic, [
			...messages,
			{ role: "assistant", content: first.text || "{}" },
			{
				role: "user",
				content: `That palette isn't readable enough: ${firstCheck.problems.join(" ")} Return a corrected palette.`,
			},
		]);
		if (checkPalette(retry.palette).ok) return res.json({ palette: pickPalette(retry.palette) });

		res.status(422).json({ message: "The AI suggestion wasn't readable enough. Please try again." });
	} catch (error) {
		console.error("AI color generation failed:", error.message);
		const message =
			error instanceof RefusalError
				? "The AI couldn't suggest colors for that description. Try describing it differently."
				: "AI color generation failed. Please try again.";
		res.status(502).json({ message });
	}
});

function pickPalette(palette) {
	return Object.fromEntries(PALETTE_KEYS.map(key => [key, palette[key].toLowerCase()]));
}

router._setClientForTests = stub => {
	clientOverride = stub;
};

module.exports = router;
