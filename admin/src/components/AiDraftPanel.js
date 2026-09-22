"use client";

import { useState } from "react";
import apiFetch from "@/lib/api";
import { SparkleIcon } from "./Icons";

export default function AiDraftPanel({ type, onGenerated, placeholder, hasExistingContent }) {
	const [prompt, setPrompt] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState("");

	const handleGenerate = async () => {
		if (!prompt.trim()) {
			setError("Type a topic first.");
			return;
		}

		if (hasExistingContent && !confirm("This will replace the content you've already written. Continue?")) {
			return;
		}

		setError("");
		setIsGenerating(true);

		try {
			const data = await apiFetch("/api/admin/ai/generate", {
				method: "POST",
				body: JSON.stringify({ type, prompt: prompt.trim() }),
			});
			onGenerated(data.result);
		} catch (err) {
			setError(err.message);
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<div className="ai-draft-panel">
			<div className="ai-draft-panel-icon">
				<SparkleIcon size={16} />
			</div>
			<div className="ai-draft-panel-body">
				<label htmlFor="ai-draft-prompt">Draft with AI (optional)</label>
				<div className="ai-draft-panel-row">
					<input
						id="ai-draft-prompt"
						value={prompt}
						onChange={e => setPrompt(e.target.value)}
						placeholder={placeholder}
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
				</div>
				{error ? <p className="ai-draft-panel-error">{error}</p> : null}
			</div>
		</div>
	);
}
