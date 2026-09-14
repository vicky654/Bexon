"use client";

function formatDate(value) {
	if (!value) return "";
	try {
		return new Date(value).toLocaleString("en-US", {
			dateStyle: "medium",
			timeStyle: "short",
		});
	} catch {
		return value;
	}
}

export default function MessageDetailModal({ message, onClose, onMarkRead }) {
	if (!message) return null;

	return (
		<div className="preview-overlay" onClick={onClose}>
			<div className="preview-modal message-modal" onClick={e => e.stopPropagation()}>
				<div className="preview-modal-header">
					<span className="preview-modal-label">Contact Query</span>
					<button type="button" className="preview-close" onClick={onClose} aria-label="Close">
						✕
					</button>
				</div>
				<div className="preview-modal-body">
					<div className="message-detail-head">
						<span className="dashboard-avatar dashboard-avatar-purple message-detail-avatar">
							{message.name?.[0]?.toUpperCase() || "?"}
						</span>
						<div>
							<h2 className="message-detail-name">{message.name}</h2>
							<span
								className={`badge ${message.status === "new" ? "badge-alert" : "badge-neutral"}`}
							>
								{message.status === "new" ? "New" : "Read"}
							</span>
						</div>
					</div>

					<dl className="message-detail-grid">
						<div>
							<dt>Email</dt>
							<dd>
								<a href={`mailto:${message.email}`}>{message.email}</a>
							</dd>
						</div>
						<div>
							<dt>Phone</dt>
							<dd>{message.phone || "—"}</dd>
						</div>
						<div>
							<dt>Service</dt>
							<dd>{message.service || "—"}</dd>
						</div>
						<div>
							<dt>Received</dt>
							<dd>{formatDate(message.createdAt)}</dd>
						</div>
					</dl>

					<div className="message-detail-body">
						<span className="message-detail-label">Message</span>
						<p>{message.message}</p>
					</div>

					<div className="message-detail-actions">
						{message.status === "new" ? (
							<button
								type="button"
								className="button"
								onClick={() => onMarkRead(message.id)}
							>
								Mark as read
							</button>
						) : null}
						<a href={`mailto:${message.email}`} className="button button-secondary">
							Reply by email
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
