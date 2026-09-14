"use client";

import { useEffect, useState } from "react";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";

function MessagesList() {
	const [messages, setMessages] = useState([]);
	const [error, setError] = useState("");

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
		} catch (err) {
			setError(err.message);
		}
	};

	return (
		<div>
			<h1>Messages</h1>
			{error ? <p className="error">{error}</p> : null}
			<table className="table">
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
						<th>Phone</th>
						<th>Service</th>
						<th>Message</th>
						<th>Status</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{messages.map(message => (
						<tr key={message.id}>
							<td>{message.name}</td>
							<td>{message.email}</td>
							<td>{message.phone || "-"}</td>
							<td>{message.service || "-"}</td>
							<td>{message.message}</td>
							<td>{message.status}</td>
							<td>
								{message.status === "new" ? (
									<button
										type="button"
										className="button-link"
										onClick={() => handleMarkRead(message.id)}
									>
										Mark read
									</button>
								) : null}
							</td>
						</tr>
					))}
				</tbody>
			</table>
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
