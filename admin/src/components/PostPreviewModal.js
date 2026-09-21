"use client";

import Link from "next/link";
import { PencilIcon } from "./Icons";

export default function PostPreviewModal({ values, onClose, editHref }) {
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

	return (
		<div className="preview-overlay" onClick={onClose}>
			<div className="preview-modal" onClick={e => e.stopPropagation()}>
				<div className="preview-modal-header">
					<span className="preview-modal-label">Preview</span>
					<div className="preview-modal-actions">
						{editHref ? (
							<Link href={editHref} className="preview-edit-btn">
								<PencilIcon size={14} /> Edit
							</Link>
						) : null}
						<button type="button" className="preview-close" onClick={onClose} aria-label="Close preview">
							✕
						</button>
					</div>
				</div>
				<div className="preview-modal-body">
					{img ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={img} alt="" className="preview-hero" />
					) : null}

					{category ? <span className="badge badge-neutral preview-category">{category}</span> : null}

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

					{tags?.length ? (
						<div className="preview-tags">
							{tags
								.split(",")
								.map(t => t.trim())
								.filter(Boolean)
								.map(tag => (
									<span key={tag} className="badge badge-neutral">
										{tag}
									</span>
								))}
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}
