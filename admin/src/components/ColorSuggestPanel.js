"use client";

import { useState } from "react";
import apiFetch from "@/lib/api";
import randomPalette from "@/lib/randomPalette";
import { SparkleIcon } from "./Icons";

// Fills the color fields with a suggested palette; nothing is saved until the
// admin presses Save.
export default function ColorSuggestPanel({ onSuggested }) {
	const [prompt, setPrompt] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState("");

	const handleGenerate = async () => {
		if (!prompt.trim()) {
			setError("Describe the look you want first.");
			return;
		}

		setError("");
		setIsGenerating(true);

		try {
			const data = await apiFetch("/api/admin/ai/colors", {
				method: "POST",
				body: JSON.stringify({ prompt: prompt.trim() }),
			});
			onSuggested(data.palette);
		} catch (err) {
			setError(err.message);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleRandom = () => {
		setError("");
		onSuggested(randomPalette());
	};

	return (
		<div className="ai-draft-panel">
			<div className="ai-draft-panel-icon">
				<SparkleIcon size={16} />
			</div>
			<div className="ai-draft-panel-body">
				<label htmlFor="ai-color-prompt">Suggest colors with AI (optional)</label>
				<div className="ai-draft-panel-row">
					<input
						id="ai-color-prompt"
						value={prompt}
						onChange={e => setPrompt(e.target.value)}
						placeholder="e.g. Trustworthy blue, calm and professional"
						maxLength={300}
						onKeyDown={e => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleGenerate();
							}
						}}
						disabled={isGenerating}
					/>
					<button
						type="button"
						className="button button-secondary"
						onClick={handleGenerate}
						disabled={isGenerating}
					>
						{isGenerating ? "Generating..." : "Generate"}
					</button>
					<button
						type="button"
						className="button button-ghost"
						onClick={handleRandom}
						disabled={isGenerating}
						title="Instant random color set"
					>
						🎲 Random
					</button>
				</div>
				{error ? <p className="ai-draft-panel-error">{error}</p> : null}
				<p className="ai-draft-panel-hint">
					Suggestions only fill in the colors below. Press Save to apply them to the website.
				</p>
			</div>
		</div>
	);
}
