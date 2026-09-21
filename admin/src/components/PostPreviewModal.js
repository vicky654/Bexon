"use client";

import Link from "next/link";
import { PencilIcon, TrashIcon, ExternalLinkIcon } from "./Icons";

export default function PostPreviewModal({ values, onClose, editHref, viewHref, onDelete }) {
	const {
		title,
		excerpt,
		content,
		img,
		category,
		author,
		authorRole,
		tags,
	} = values;

	const tagList = Array.isArray(tags)
		? tags.map(t => String(t).trim()).filter(Boolean)
		: typeof tags === "string"
		? tags.split(",").map(t => t.trim()).filter(Boolean)
		: [];

	const TAG_COLORS = 6;
	const tagColorIndex = tag => {
		let hash = 0;
		for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
		return hash % TAG_COLORS;
	};

	return (
		<div className="preview-overlay" onClick={onClose}>
			<div className="preview-modal" onClick={e => e.stopPropagation()}>
				<div className="preview-modal-header">
					<div className="preview-modal-header-top">
						<span className="preview-modal-label">Preview</span>
						<div className="preview-modal-actions">
							{viewHref ? (
								<a
									href={viewHref}
									target="_blank"
									rel="noopener noreferrer"
									className="preview-secondary-btn"
								>
									<ExternalLinkIcon size={14} /> View live
								</a>
							) : null}
							{editHref ? (
								<Link href={editHref} className="preview-edit-btn">
									<PencilIcon size={14} /> Edit
								</Link>
							) : null}
							{onDelete ? (
								<button type="button" className="preview-delete-btn" onClick={onDelete}>
									<TrashIcon size={14} /> Delete
								</button>
							) : null}
							<button
								type="button"
								className="preview-close"
								onClick={onClose}
								aria-label="Close preview"
							>
								✕
							</button>
						</div>
					</div>
					{tagList.length ? (
						<div className="preview-modal-tags">
							{tagList.map(tag => (
								<span key={tag} className={`badge-tag badge-tag-${tagColorIndex(tag)}`}>
									{tag}
								</span>
							))}
						</div>
					) : null}
				</div>
				<div className="preview-modal-body">
					{img ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={img} alt="" className="preview-hero" />
					) : null}

					{category ? (
						<span className={`badge-tag preview-category badge-tag-${tagColorIndex(category)}`}>
							{category}
						</span>
					) : null}

					<h1 className="preview-title">{title || "Untitled post"}</h1>

					{author ? (
						<p className="preview-byline">
							By <strong>{author}</strong>
							{authorRole ? ` · ${authorRole}` : ""}
						</p>
					) : null}

					{excerpt ? <p className="preview-excerpt">{excerpt}</p> : null}

					<div className="editor-content preview-content">
						<div
							className="tiptap"
							dangerouslySetInnerHTML={{
								__html: content || "<p><em>No content yet.</em></p>",
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
