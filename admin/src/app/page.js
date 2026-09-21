"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import { SkeletonStatCards, SkeletonListRows } from "@/components/Skeleton";

const icon = (path, extra) => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		{path}
		{extra}
	</svg>
);

const ICONS = {
	posts: icon(
		<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />,
		<>
			<path d="M14 2v6h6" />
			<path d="M9 13h6M9 17h6M9 9h1" />
		</>
	),
	published: icon(
		<>
			<circle cx="12" cy="12" r="10" />
			<path d="m8.5 12.5 2.5 2.5 5-5" />
		</>
	),
	drafts: icon(
		<>
			<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
		</>
	),
	messages: icon(<path d="M4 4h16v14H8l-4 4Z" />),
	alerts: icon(
		<>
			<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
			<path d="M13.73 21a2 2 0 0 1-3.46 0" />
		</>
	),
};

function initials(name) {
	if (!name) return "?";
	return name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map(part => part[0]?.toUpperCase())
		.join("");
}

function timeGreeting() {
	const hour = new Date().getHours();
	if (hour < 12) return "Good morning";
	if (hour < 18) return "Good afternoon";
	return "Good evening";
}

function formatRelativeTime(dateString) {
	if (!dateString) return "";
	const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
	if (diffSec < 60) return "just now";
	const diffMin = Math.floor(diffSec / 60);
	if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
	const diffHour = Math.floor(diffMin / 60);
	if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
	const diffDay = Math.floor(diffHour / 24);
	if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
	const diffMonth = Math.floor(diffDay / 30);
	if (diffMonth < 12) return `${diffMonth} month${diffMonth === 1 ? "" : "s"} ago`;
	const diffYear = Math.floor(diffMonth / 12);
	return `${diffYear} year${diffYear === 1 ? "" : "s"} ago`;
}

function StatCard({ label, value, tone, iconKey }) {
	return (
		<div className="stat-card">
			<div className={`stat-card-icon stat-card-icon-${tone || "default"}`}>
				{ICONS[iconKey]}
			</div>
			<div className="stat-card-body">
				<span className="stat-card-value">{value}</span>
				<span className="stat-card-label">{label}</span>
			</div>
		</div>
	);
}

function Dashboard() {
	const [blogs, setBlogs] = useState(null);
	const [messages, setMessages] = useState(null);
	const [error, setError] = useState("");

	useEffect(() => {
		Promise.all([apiFetch("/api/admin/blogs"), apiFetch("/api/admin/messages")])
			.then(([blogsData, messagesData]) => {
				setBlogs(blogsData.blogs || []);
				setMessages(messagesData.messages || []);
			})
			.catch(err => setError(err.message));
	}, []);

	if (error) return <p className="error">{error}</p>;

	const isLoading = !blogs || !messages;
	const publishedCount = isLoading ? 0 : blogs.filter(b => b.published).length;
	const draftCount = isLoading ? 0 : blogs.length - publishedCount;
	const newMessageCount = isLoading ? 0 : messages.filter(m => m.status === "new").length;
	const recentBlogs = isLoading ? [] : blogs.slice(0, 5);
	const recentMessages = isLoading ? [] : messages.slice(0, 5);
	const today = new Date().toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
	});

	return (
		<div>
			<div className="dashboard-welcome">
				<div>
					<p className="dashboard-welcome-date">{today}</p>
					<h1>{timeGreeting()}!</h1>
					<p className="dashboard-welcome-subtitle">
						Here&apos;s what&apos;s happening with your content today.
					</p>
				</div>
				<Link href="/blogs/new" className="dashboard-welcome-btn">
					New Post
				</Link>
			</div>

			{isLoading ? (
				<SkeletonStatCards count={5} />
			) : (
				<div className="stat-grid">
					<StatCard label="Total Posts" value={blogs.length} tone="blue" iconKey="posts" />
					<StatCard label="Published" value={publishedCount} tone="green" iconKey="published" />
					<StatCard label="Drafts" value={draftCount} tone="gray" iconKey="drafts" />
					<StatCard label="Total Messages" value={messages.length} tone="purple" iconKey="messages" />
					<StatCard label="New Queries" value={newMessageCount} tone="amber" iconKey="alerts" />
				</div>
			)}

			<div className="dashboard-grid">
				<div className="dashboard-panel">
					<div className="dashboard-panel-header">
						<h2>Recent Posts</h2>
						<Link href="/blogs">View all</Link>
					</div>
					{isLoading ? (
						<SkeletonListRows count={4} />
					) : recentBlogs.length ? (
						<ul className="dashboard-list">
							{recentBlogs.map(blog => (
								<li key={blog.id}>
									<span className="dashboard-avatar dashboard-avatar-blue">
										{initials(blog.title)}
									</span>
									<div className="dashboard-list-main">
										<Link href={`/blogs/${blog.id}/edit`}>{blog.title}</Link>
										<span className="dashboard-list-meta">
											/{blog.slug} · {formatRelativeTime(blog.publishedAt || blog.createdAt)}
										</span>
									</div>
									<span
										className={`badge ${blog.published ? "badge-good" : "badge-neutral"}`}
									>
										{blog.published ? "Published" : "Draft"}
									</span>
								</li>
							))}
						</ul>
					) : (
						<p className="dashboard-empty">No posts yet.</p>
					)}
				</div>

				<div className="dashboard-panel">
					<div className="dashboard-panel-header">
						<h2>Recent Queries</h2>
						<Link href="/messages">View all</Link>
					</div>
					{isLoading ? (
						<SkeletonListRows count={4} />
					) : recentMessages.length ? (
						<ul className="dashboard-list">
							{recentMessages.map(message => (
								<li key={message.id}>
									<span className="dashboard-avatar dashboard-avatar-purple">
										{initials(message.name)}
									</span>
									<div className="dashboard-list-main">
										<span>{message.name}</span>
										<span className="dashboard-list-meta">
											{message.email} · {formatRelativeTime(message.createdAt)}
										</span>
									</div>
									<span
										className={`badge ${message.status === "new" ? "badge-alert" : "badge-neutral"}`}
									>
										{message.status === "new" ? "New" : "Read"}
									</span>
								</li>
							))}
						</ul>
					) : (
						<p className="dashboard-empty">No queries yet.</p>
					)}
				</div>
			</div>
		</div>
	);
}

export default function DashboardPage() {
	return (
		<RequireAuth>
			<Dashboard />
		</RequireAuth>
	);
}
