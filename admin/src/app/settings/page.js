"use client";

import { useEffect, useState } from "react";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CheckIcon } from "@/components/Icons";

const COLOR_FIELDS = [
	{
		key: "primaryColor",
		label: "Primary Color",
		help: "Main brand color used for buttons and highlights",
	},
	{
		key: "secondaryColor",
		label: "Secondary Color",
		help: "Accent used in footers and dark sections",
	},
	{
		key: "hoverColor",
		label: "Hover Color",
		help: "Shown when hovering links and buttons",
	},
	{
		key: "textColor",
		label: "Text Color",
		help: "Default body text color across the site",
	},
	{
		key: "headingColor",
		label: "Heading Color",
		help: "Used for headings and titles",
	},
	{
		key: "backgroundColor",
		label: "Background Color",
		help: "Base background color for light sections",
	},
];

const DEFAULT_COLORS = {
	primaryColor: "#02092c",
	secondaryColor: "#0c1e21",
	hoverColor: "#02092c",
	textColor: "#364e52",
	headingColor: "#0c1e21",
	backgroundColor: "#d8e5e5",
};

function AlertIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
			<circle cx="12" cy="12" r="10" />
			<line x1="12" y1="8" x2="12" y2="13" />
			<line x1="12" y1="16" x2="12" y2="16.01" />
		</svg>
	);
}

function SettingsForm() {
	const [values, setValues] = useState(null);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		apiFetch("/api/settings")
			.then(data => setValues(data.settings))
			.catch(err => setError(err.message));
	}, []);

	const handleChange = (key, value) => {
		setValues(prev => ({ ...prev, [key]: value }));
	};

	const handleReset = () => {
		setError("");
		setSuccess("");
		setValues(DEFAULT_COLORS);
	};

	const handleSubmit = async e => {
		e.preventDefault();
		setError("");
		setSuccess("");
		setIsSaving(true);

		try {
			const data = await apiFetch("/api/admin/settings", {
				method: "PUT",
				body: JSON.stringify(values),
			});
			setValues(data.settings);
			setSuccess("Colors saved.");
		} catch (err) {
			setError(err.message);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div>
			<Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Settings" }]} />
			<div className="page-header">
				<div>
					<h1>Settings</h1>
					<p className="dashboard-subtitle">Colors used across the public website</p>
				</div>
			</div>
			{values === null ? (
				error ? <p className="error">{error}</p> : <p className="dashboard-subtitle">Loading...</p>
			) : (
				<form onSubmit={handleSubmit} className="form">
					<div className="settings-swatch-grid">
						{COLOR_FIELDS.map(field => (
							<div className="settings-swatch-card" key={field.key}>
								<label className="settings-swatch-preview">
									<span style={{ position: "absolute", inset: 0, background: values[field.key] }} />
									<input
										type="color"
										aria-label={`${field.label} picker`}
										value={values[field.key]}
										onChange={e => handleChange(field.key, e.target.value)}
									/>
								</label>
								<div className="settings-swatch-info">
									<label htmlFor={field.key}>{field.label}</label>
									<p className="settings-swatch-help">{field.help}</p>
									<input
										id={field.key}
										value={values[field.key]}
										onChange={e => handleChange(field.key, e.target.value)}
										pattern="^#[0-9A-Fa-f]{6}$"
										required
									/>
								</div>
							</div>
						))}
					</div>

					<div className="settings-preview">
						<p className="settings-preview-label">Live Preview</p>
						<div
							className="settings-preview-card"
							style={{ background: values.backgroundColor }}
						>
							<h3 style={{ color: values.headingColor }}>Preview Heading</h3>
							<p style={{ color: values.textColor }}>
								This is how your site&apos;s body text will look.
							</p>
							<div className="settings-preview-row">
								<span
									className="settings-preview-btn"
									style={{ background: values.primaryColor }}
								>
									Primary Button
								</span>
								<span
									className="settings-preview-btn"
									style={{ background: values.hoverColor }}
								>
									Hover State
								</span>
								<span
									className="settings-preview-badge"
									style={{ background: values.secondaryColor }}
								>
									Secondary Accent
								</span>
							</div>
						</div>
					</div>

					{error ? (
						<div className="settings-alert settings-alert-error">
							<AlertIcon />
							{error}
						</div>
					) : null}
					{success ? (
						<div className="settings-alert settings-alert-success">
							<CheckIcon size={16} />
							{success}
						</div>
					) : null}

					<div className="settings-actions">
						<button type="submit" className="button" disabled={isSaving}>
							{isSaving ? "Saving..." : "Save Colors"}
						</button>
						<button
							type="button"
							className="button-secondary"
							onClick={handleReset}
							disabled={isSaving}
						>
							Reset to Defaults
						</button>
					</div>
				</form>
			)}
		</div>
	);
}

export default function SettingsPage() {
	return (
		<RequireAuth>
			<SettingsForm />
		</RequireAuth>
	);
}
