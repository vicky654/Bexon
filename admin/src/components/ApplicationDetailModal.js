"use client";

const STATUS_OPTIONS = [
	{ value: "new", label: "New", badgeClass: "badge-alert" },
	{ value: "reviewed", label: "Reviewed", badgeClass: "badge-neutral" },
	{ value: "shortlisted", label: "Shortlisted", badgeClass: "badge-good" },
	{ value: "rejected", label: "Rejected", badgeClass: "badge-danger" },
];

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

function statusMeta(status) {
	return STATUS_OPTIONS.find(opt => opt.value === status) || STATUS_OPTIONS[0];
}

export default function ApplicationDetailModal({ application, onClose, onStatusChange, onDelete }) {
	if (!application) return null;
	const meta = statusMeta(application.status);

	return (
		<div className="preview-overlay" onClick={onClose}>
			<div className="preview-modal message-modal" onClick={e => e.stopPropagation()}>
				<div className="preview-modal-header">
					<span className="preview-modal-label">Job Application</span>
					<button type="button" className="preview-close" onClick={onClose} aria-label="Close">
						✕
					</button>
				</div>
				<div className="preview-modal-body">
					<div className="message-detail-head">
						<span className="dashboard-avatar dashboard-avatar-purple message-detail-avatar">
							{application.name?.[0]?.toUpperCase() || "?"}
						</span>
						<div>
							<h2 className="message-detail-name">{application.name}</h2>
							<span className={`badge ${meta.badgeClass}`}>{meta.label}</span>
						</div>
					</div>

					<dl className="message-detail-grid">
						<div>
							<dt>Email</dt>
							<dd>
								<a href={`mailto:${application.email}`}>{application.email}</a>
							</dd>
						</div>
						<div>
							<dt>Phone</dt>
							<dd>{application.phone || "—"}</dd>
						</div>
						<div>
							<dt>Applied for</dt>
							<dd>{application.job?.title || "—"}</dd>
						</div>
						<div>
							<dt>Received</dt>
							<dd>{formatDate(application.createdAt)}</dd>
						</div>
					</dl>

					{application.coverLetter ? (
						<div className="message-detail-body">
							<span className="message-detail-label">Cover Letter</span>
							<p>{application.coverLetter}</p>
						</div>
					) : null}

					<div className="message-detail-actions">
						{application.resumeUrl ? (
							<a
								href={application.resumeUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="button"
							>
								Download Resume
							</a>
						) : null}
						<a href={`mailto:${application.email}`} className="button button-secondary">
							Reply by email
						</a>
						<select
							className="application-status-select"
							value={application.status}
							onChange={e => onStatusChange(application.id, e.target.value)}
						>
							{STATUS_OPTIONS.map(opt => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
						<button
							type="button"
							className="button button-secondary"
							onClick={() => onDelete(application.id)}
						>
							Delete
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
