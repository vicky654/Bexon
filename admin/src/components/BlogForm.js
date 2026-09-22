"use client";

import { useState } from "react";
import RichTextEditor from "./RichTextEditor";
import PostPreviewModal from "./PostPreviewModal";
import AiDraftPanel from "./AiDraftPanel";
import { ChevronDownIcon } from "./Icons";

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
	excerpt: "",
	content: "",
	img: "",
	category: "",
	tags: "",
	author: "",
	authorRole: "",
	status: "",
	published: true,
};

export default function BlogForm({ initialValues, onSubmit, submitLabel }) {
	const [values, setValues] = useState({
		...initialState,
		...initialValues,
		tags: initialValues?.tags ? initialValues.tags.join(", ") : "",
	});
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const [showAdvanced, setShowAdvanced] = useState(false);
	// Once editing an existing post (it already has a slug), or once the user
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

	const handleContentChange = html => {
		setValues(prev => ({ ...prev, content: html }));
	};

	const handleAiGenerated = result => {
		setValues(prev => ({
			...prev,
			title: result.title || prev.title,
			excerpt: result.excerpt || prev.excerpt,
			content: result.content || prev.content,
			...(result.title && !slugTouched ? { slug: slugify(result.title) } : {}),
		}));
	};

	const handleSubmit = async e => {
		e.preventDefault();
		setError("");
		setIsSubmitting(true);

		try {
			await onSubmit({
				...values,
				tags: values.tags
					.split(",")
					.map(tag => tag.trim())
					.filter(Boolean),
			});
		} catch (err) {
			setError(err.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="form">
			<AiDraftPanel
				type="blog"
				onGenerated={handleAiGenerated}
				placeholder="e.g. What the DPDP Act means for HR teams"
				hasExistingContent={Boolean(values.content)}
			/>

			<div className="form-row">
				<div className="form-field">
					<label htmlFor="title">Title</label>
					<input
						id="title"
						name="title"
						value={values.title}
						onChange={handleChange}
						placeholder="e.g. 5 Ways to Protect Customer Data"
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
						placeholder="e.g. 5-ways-to-protect-customer-data"
						required
					/>
				</div>
			</div>

			<div className="form-field">
				<label htmlFor="excerpt">Excerpt</label>
				<textarea
					id="excerpt"
					name="excerpt"
					rows={2}
					value={values.excerpt}
					onChange={handleChange}
					placeholder="A short summary shown in blog listings"
				/>
			</div>

			<div className="form-field">
				<label>Content</label>
				<RichTextEditor
					content={values.content}
					onChange={handleContentChange}
					placeholder="Write your post content..."
				/>
			</div>

			<div className="form-row">
				<div className="form-field">
					<label htmlFor="category">Category</label>
					<input
						id="category"
						name="category"
						value={values.category}
						onChange={handleChange}
						placeholder="e.g. Compliance"
					/>
				</div>
				<div className="form-field">
					<label htmlFor="tags">Tags (comma separated)</label>
					<input id="tags" name="tags" value={values.tags} onChange={handleChange} placeholder="Business, Strategy" />
				</div>
			</div>

			<button
				type="button"
				className="form-advanced-toggle"
				onClick={() => setShowAdvanced(prev => !prev)}
				aria-expanded={showAdvanced}
			>
				<ChevronDownIcon size={16} className={showAdvanced ? "form-advanced-chevron-open" : ""} />
				{showAdvanced ? "Hide advanced options" : "Show advanced options"}
			</button>

			{showAdvanced ? (
				<div className="form-advanced-section">
					<div className="form-row">
						<div className="form-field">
							<label htmlFor="img">Image URL</label>
							<input
								id="img"
								name="img"
								value={values.img}
								onChange={handleChange}
								placeholder="https://..."
							/>
						</div>
						<div className="form-field">
							<label htmlFor="status">Status badge</label>
							<input
								id="status"
								name="status"
								value={values.status}
								onChange={handleChange}
								placeholder="Tutorial, Tips..."
							/>
						</div>
					</div>

					<div className="form-row">
						<div className="form-field">
							<label htmlFor="author">Author</label>
							<input
								id="author"
								name="author"
								value={values.author}
								onChange={handleChange}
								placeholder="e.g. Jane Doe"
							/>
						</div>
						<div className="form-field">
							<label htmlFor="authorRole">Author role</label>
							<input
								id="authorRole"
								name="authorRole"
								value={values.authorRole}
								onChange={handleChange}
								placeholder="e.g. Privacy Consultant"
							/>
						</div>
					</div>
				</div>
			) : null}

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
				<button
					type="button"
					className="button button-secondary"
					onClick={() => setShowPreview(true)}
				>
					Preview
				</button>
			</div>

			{showPreview ? (
				<PostPreviewModal values={values} onClose={() => setShowPreview(false)} />
			) : null}
		</form>
	);
}
