"use client";

import { useEffect, useState } from "react";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import Breadcrumbs from "@/components/Breadcrumbs";
import MessageDetailModal from "@/components/MessageDetailModal";
import { SkeletonTableRows } from "@/components/Skeleton";
import { EyeIcon, CheckIcon } from "@/components/Icons";

function MessagesList() {
	const [messages, setMessages] = useState(null);
	const [error, setError] = useState("");
	const [selected, setSelected] = useState(null);

	const loadMessages = () => {
		apiFetch("/api/admin/messages")
			.then(data => setMessages(data.messages || []))
			.catch(err => setError(err.message));
	};

	useEffect(() => {
		loadMessages();
	}, []);

	const handleMarkRead = async id => {
		try {
			await apiFetch(`/api/admin/messages/${id}`, {
				method: "PATCH",
				body: JSON.stringify({ status: "read" }),
			});
			loadMessages();
			setSelected(prev => (prev && prev.id === id ? { ...prev, status: "read" } : prev));
		} catch (err) {
			setError(err.message);
		}
	};

	const isLoading = messages === null;
	const newCount = isLoading ? 0 : messages.filter(m => m.status === "new").length;

	return (
		<div>
			<Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Messages" }]} />
			<div className="page-header">
				<div>
					<h1>Messages</h1>
					<p className="dashboard-subtitle">
						{isLoading ? "Loading..." : `${messages.length} total · ${newCount} new`}
					</p>
				</div>
			</div>
			{error ? <p className="error">{error}</p> : null}
			<table className="table">
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
						<th>Service</th>
						<th>Message</th>
						<th>Status</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{isLoading ? (
						<SkeletonTableRows columns={6} rows={6} />
					) : (
						messages.map(message => (
							<tr key={message.id}>
								<td>{message.name}</td>
								<td className="table-muted">{message.email}</td>
								<td className="table-muted">{message.service || "-"}</td>
								<td className="table-message">{message.message}</td>
								<td>
									<span
										className={`badge ${message.status === "new" ? "badge-alert" : "badge-neutral"}`}
									>
										{message.status === "new" ? "New" : "Read"}
									</span>
								</td>
								<td>
									<div className="row-icon-actions">
										<button
											type="button"
											className="row-icon-btn row-icon-btn-view"
											title="View details"
											onClick={() => setSelected(message)}
										>
											<EyeIcon size={16} />
										</button>
										{message.status === "new" ? (
											<button
												type="button"
												className="row-icon-btn"
												title="Mark as read"
												onClick={() => handleMarkRead(message.id)}
											>
												<CheckIcon size={16} />
											</button>
										) : null}
									</div>
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>

			{selected ? (
				<MessageDetailModal
					message={selected}
					onClose={() => setSelected(null)}
					onMarkRead={handleMarkRead}
				/>
			) : null}
		</div>
	);
}

export default function MessagesPage() {
	return (
		<RequireAuth>
			<MessagesList />
		</RequireAuth>
	);
}
