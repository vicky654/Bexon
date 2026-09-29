"use client";

import { useEffect, useRef, useState } from "react";
import apiFetch, { BACKEND_URL } from "@/lib/api";
import { LEAD_TYPE_TABS, leadTypeLabel } from "@/lib/leadTypes";
import RequireAuth from "@/components/RequireAuth";
import Breadcrumbs from "@/components/Breadcrumbs";
import MessageDetailModal from "@/components/MessageDetailModal";
import { SkeletonTableRows } from "@/components/Skeleton";

function initials(name) {
	if (!name) return "?";
	return name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map(part => part[0]?.toUpperCase())
		.join("");
}

function MessagesList() {
	const [messages, setMessages] = useState(null);
	const [error, setError] = useState("");
	const [selected, setSelected] = useState(null);
	const [type, setType] = useState("all");
	const [counts, setCounts] = useState(null);
	const latestType = useRef("all");

	const loadMessages = () => {
		const requestedType = type;
		latestType.current = requestedType;
		const query = requestedType === "all" ? "" : `?type=${requestedType}`;
		apiFetch(`/api/admin/messages${query}`)
			.then(data => {
				if (latestType.current === requestedType) {
					setMessages(data.messages || []);
					setCounts(data.counts || {});
				}
			})
			.catch(err => {
				if (latestType.current === requestedType) {
					setError(err.message);
				}
			});
	};

	useEffect(() => {
		setMessages(null);
		loadMessages();
	}, [type]);

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
				<a
					className="button button-secondary"
					href={`${BACKEND_URL}/api/admin/messages/export.csv${type === "all" ? "" : `?type=${type}`}`}
				>
					Export CSV
				</a>
			</div>
			{error ? <p className="error">{error}</p> : null}
			<div className="filter-tabs" role="tablist">
				{LEAD_TYPE_TABS.map(tab => (
					<button
						key={tab.value}
						type="button"
						role="tab"
						aria-selected={type === tab.value}
						className={`filter-tab${type === tab.value ? " filter-tab-active" : ""}`}
						onClick={() => setType(tab.value)}
					>
						{tab.label}
						{counts ? <span className="filter-tab-count">{counts[tab.value] ?? 0}</span> : null}
					</button>
				))}
			</div>
			<table className="table">
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
						<th>Type</th>
						<th>Purpose</th>
						<th>Message</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{isLoading ? (
						<SkeletonTableRows columns={6} rows={6} />
					) : (
						messages.map(message => (
							<tr
								key={message.id}
								className="table-row-clickable"
								onClick={() => setSelected(message)}
							>
								<td>
									<div className="table-name-cell">
										<span className="dashboard-avatar dashboard-avatar-purple">
											{initials(message.name)}
										</span>
										{message.name}
									</div>
								</td>
								<td className="table-muted">{message.email}</td>
								<td>
									<span className="badge badge-neutral">{leadTypeLabel(message.type)}</span>
								</td>
								<td className="table-muted">{message.service || "-"}</td>
								<td className="table-message">{message.message}</td>
								<td>
									<span
										className={`badge ${message.status === "new" ? "badge-alert" : "badge-neutral"}`}
									>
										{message.status === "new" ? "New" : "Read"}
									</span>
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
