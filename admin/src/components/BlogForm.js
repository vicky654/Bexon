"use client";

import { useState } from "react";
import RichTextEditor from "./RichTextEditor";
import PostPreviewModal from "./PostPreviewModal";

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

	const handleChange = e => {
		const { name, value, type, checked } = e.target;
		setValues(prev => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	const handleContentChange = html => {
		setValues(prev => ({ ...prev, content: html }));
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
			<div className="form-row">
				<div className="form-field">
					<label htmlFor="title">Title</label>
					<input id="title" name="title" value={values.title} onChange={handleChange} required />
				</div>
				<div className="form-field">
					<label htmlFor="slug">Slug</label>
					<input id="slug" name="slug" value={values.slug} onChange={handleChange} required />
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
					<label htmlFor="img">Image URL</label>
					<input id="img" name="img" value={values.img} onChange={handleChange} placeholder="https://..." />
				</div>
				<div className="form-field">
					<label htmlFor="category">Category</label>
					<input id="category" name="category" value={values.category} onChange={handleChange} />
				</div>
			</div>

			<div className="form-row">
				<div className="form-field">
					<label htmlFor="tags">Tags (comma separated)</label>
					<input id="tags" name="tags" value={values.tags} onChange={handleChange} placeholder="Business, Strategy" />
				</div>
				<div className="form-field">
					<label htmlFor="status">Status badge</label>
					<input id="status" name="status" value={values.status} onChange={handleChange} placeholder="Tutorial, Tips..." />
				</div>
			</div>

			<div className="form-row">
				<div className="form-field">
					<label htmlFor="author">Author</label>
					<input id="author" name="author" value={values.author} onChange={handleChange} />
				</div>
				<div className="form-field">
					<label htmlFor="authorRole">Author role</label>
					<input id="authorRole" name="authorRole" value={values.authorRole} onChange={handleChange} />
				</div>
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
