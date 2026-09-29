"use client";

import { useState } from "react";
import apiFetch, { BACKEND_URL } from "@/lib/api";
import RichTextEditor from "./RichTextEditor";
import AiDraftPanel from "./AiDraftPanel";
import { EVENT_FORMATS, RESOURCE_TYPES, toLocalInput, fromLocalInput } from "@/lib/contentKinds";

function slugify(text) {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

const initialState = {
	title: "",
	slug: "",
	summary: "",
	body: "",
	coverImage: "",
	published: false,
	publishedAt: "",
	sourceUrl: "",
	startsAt: "",
	endsAt: "",
	format: "online",
	venue: "",
	recordingUrl: "",
	resourceType: "whitepaper",
	fileKey: "",
	gated: true,
};

export default function ContentForm({ kind, initialValues, onSubmit, submitLabel }) {
	const [values, setValues] = useState({
		...initialState,
		...initialValues,
		publishedAt: toLocalInput(initialValues?.publishedAt),
		startsAt: toLocalInput(initialValues?.startsAt),
		endsAt: toLocalInput(initialValues?.endsAt),
	});
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isUploadingCover, setIsUploadingCover] = useState(false);
	const [coverError, setCoverError] = useState("");
	const [isUploadingFile, setIsUploadingFile] = useState(false);
	const [fileError, setFileError] = useState("");
	// Once editing an existing item (it already has a slug), or once the user
	// edits the slug themselves, stop auto-deriving it from the title.
	const [slugTouched, setSlugTouched] = useState(Boolean(initialValues?.slug));

	const handleChange = e => {
		const { name, value, type, checked } = e.target;

		if (name === "slug") {
			setSlugTouched(true);
		}

		setValues(prev => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
			...(name === "title" && !slugTouched ? { slug: slugify(value) } : {}),
		}));
	};

	const handleBodyChange = html => {
		setValues(prev => ({ ...prev, body: html }));
	};

	const handleAiGenerated = result => {
		setValues(prev => ({
			...prev,
			title: result.title || prev.title,
			summary: result.excerpt || prev.summary,
			body: result.content || prev.body,
			...(result.title && !slugTouched ? { slug: slugify(result.title) } : {}),
		}));
	};

	const handleCoverUpload = async e => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;

		setCoverError("");
		setIsUploadingCover(true);
		try {
			const formData = new FormData();
			formData.append("image", file);
			const res = await fetch(`${BACKEND_URL}/api/admin/upload`, {
				method: "POST",
				credentials: "include",
				body: formData,
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data.message || "Image upload failed.");
			}
			setValues(prev => ({ ...prev, coverImage: `${BACKEND_URL}${data.url}` }));
		} catch (err) {
			setCoverError(err.message);
		} finally {
			setIsUploadingCover(false);
		}
	};

	const handleResourceFileUpload = async e => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;

		setFileError("");
		setIsUploadingFile(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			const res = await fetch(`${BACKEND_URL}/api/admin/upload/resource`, {
				method: "POST",
				credentials: "include",
				body: formData,
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data.message || "File upload failed.");
			}
			setValues(prev => ({ ...prev, fileKey: data.fileKey }));
		} catch (err) {
			setFileError(err.message);
		} finally {
			setIsUploadingFile(false);
		}
	};

	const handleSubmit = async e => {
		e.preventDefault();
		setError("");
		setIsSubmitting(true);

		try {
			await onSubmit({
				...values,
				kind,
				publishedAt: fromLocalInput(values.publishedAt),
				startsAt: fromLocalInput(values.startsAt),
				endsAt: fromLocalInput(values.endsAt),
			});
		} catch (err) {
			setError(err.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="form">
			{kind === "news" ? (
				<AiDraftPanel
					type="news"
					onGenerated={handleAiGenerated}
					placeholder="e.g. What the DPDP Act's new draft rules mean for HR teams"
					hasExistingContent={Boolean(values.body)}
				/>
			) : null}

			<div className="form-row">
				<div className="form-field">
					<label htmlFor="title">Title</label>
					<input
						id="title"
						name="title"
						value={values.title}
						onChange={handleChange}
						placeholder="e.g. New data protection guidance released"
						required
					/>
				</div>
				<div className="form-field">
					<label htmlFor="slug">Slug</label>
					<input
						id="slug"
						name="slug"
						value={values.slug}
						onChange={handleChange}
						placeholder="e.g. new-data-protection-guidance-released"
						required
					/>
				</div>
			</div>

			<div className="form-field">
				<label htmlFor="summary">Summary</label>
				<textarea
					id="summary"
					name="summary"
					rows={2}
					value={values.summary}
					onChange={handleChange}
					placeholder="A short summary shown in listings"
					maxLength={300}
					required
				/>
				<span className="form-counter">{values.summary.length}/300</span>
			</div>

			<div className="form-field">
				<label>Body</label>
				<RichTextEditor
					content={values.body}
					onChange={handleBodyChange}
					placeholder="Write the content..."
				/>
			</div>

			<div className="form-field">
				<label htmlFor="coverImage">Cover image</label>
				<div className="form-inline-upload">
					<input
						id="coverImage"
						name="coverImage"
						value={values.coverImage}
						onChange={handleChange}
						placeholder="https://... or upload below"
					/>
					<label className="button button-secondary form-upload-btn">
						{isUploadingCover ? "Uploading..." : "Upload image"}
						<input
							type="file"
							accept="image/*"
							className="editor-file-input"
							onChange={handleCoverUpload}
							disabled={isUploadingCover}
						/>
					</label>
				</div>
				{coverError ? <p className="error">{coverError}</p> : null}
				{values.coverImage ? (
					<img src={values.coverImage} alt="Cover preview" className="form-image-preview" />
				) : null}
			</div>

			{kind === "news" ? (
				<div className="form-field">
					<label htmlFor="sourceUrl">Source link (optional)</label>
					<input
						id="sourceUrl"
						name="sourceUrl"
						value={values.sourceUrl}
						onChange={handleChange}
						placeholder="https://..."
					/>
				</div>
			) : null}

			{kind === "event" ? (
				<>
					<div className="form-row">
						<div className="form-field">
							<label htmlFor="startsAt">Starts</label>
							<input
								id="startsAt"
								name="startsAt"
								type="datetime-local"
								value={values.startsAt}
								onChange={handleChange}
								required
							/>
						</div>
						<div className="form-field">
							<label htmlFor="endsAt">Ends (optional)</label>
							<input
								id="endsAt"
								name="endsAt"
								type="datetime-local"
								value={values.endsAt}
								onChange={handleChange}
							/>
						</div>
					</div>
					<div className="form-row">
						<div className="form-field">
							<label htmlFor="format">Format</label>
							<select id="format" name="format" value={values.format} onChange={handleChange}>
								{EVENT_FORMATS.map(option => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</div>
						<div className="form-field">
							<label htmlFor="venue">Venue / joining info</label>
							<input
								id="venue"
								name="venue"
								value={values.venue}
								onChange={handleChange}
								placeholder="e.g. Zoom link or venue address"
							/>
						</div>
					</div>
					<div className="form-field">
						<label htmlFor="recordingUrl">Recording link</label>
						<input
							id="recordingUrl"
							name="recordingUrl"
							value={values.recordingUrl}
							onChange={handleChange}
							placeholder="https://..."
						/>
					</div>
				</>
			) : null}

			{kind === "resource" ? (
				<>
					<div className="form-field">
						<label htmlFor="resourceType">Type</label>
						<select id="resourceType" name="resourceType" value={values.resourceType} onChange={handleChange}>
							{RESOURCE_TYPES.map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>
					<div className="form-field">
						<label htmlFor="resourceFile">PDF file</label>
						<label className="button button-secondary form-upload-btn">
							{isUploadingFile ? "Uploading..." : "Upload PDF"}
							<input
								id="resourceFile"
								type="file"
								accept="application/pdf"
								className="editor-file-input"
								onChange={handleResourceFileUpload}
								disabled={isUploadingFile}
							/>
						</label>
						<span className="form-file-status">
							{values.fileKey ? `Current file: ${values.fileKey}` : "No file uploaded yet"}
						</span>
						{fileError ? <p className="error">{fileError}</p> : null}
					</div>
					<div className="form-field form-field-checkbox">
						<label htmlFor="gated" className="form-checkbox-label">
							<input
								id="gated"
								name="gated"
								type="checkbox"
								checked={values.gated}
								onChange={handleChange}
							/>
							Gated (visitors fill a form before downloading)
						</label>
					</div>
				</>
			) : null}

			<div className="form-field">
				<label htmlFor="publishedAt">Publish date</label>
				<input
					id="publishedAt"
					name="publishedAt"
					type="datetime-local"
					value={values.publishedAt}
					onChange={handleChange}
				/>
			</div>

			<div className="form-field form-field-checkbox">
				<label htmlFor="published" className="form-checkbox-label">
					<input
						id="published"
						name="published"
						type="checkbox"
						checked={values.published}
						onChange={handleChange}
					/>
					Published
				</label>
			</div>

			{error ? <p className="error">{error}</p> : null}

			<div className="form-actions">
				<button type="submit" className="button" disabled={isSubmitting}>
					{isSubmitting ? "Saving..." : submitLabel}
				</button>
			</div>
		</form>
	);
}
