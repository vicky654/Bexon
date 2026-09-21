"use client";

import { useEffect, useState } from "react";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import Breadcrumbs from "@/components/Breadcrumbs";

const COLOR_FIELDS = [
	{ key: "primaryColor", label: "Primary Color" },
	{ key: "secondaryColor", label: "Secondary Color" },
	{ key: "hoverColor", label: "Hover Color" },
	{ key: "textColor", label: "Text Color" },
	{ key: "headingColor", label: "Heading Color" },
	{ key: "backgroundColor", label: "Background Color" },
];

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
					<div className="form-row">
						{COLOR_FIELDS.map(field => (
							<div className="form-field" key={field.key}>
								<label htmlFor={field.key}>{field.label}</label>
								<div className="settings-color-row">
									<input
										type="color"
										aria-label={`${field.label} picker`}
										value={values[field.key]}
										onChange={e => handleChange(field.key, e.target.value)}
									/>
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
					{error ? <p className="error">{error}</p> : null}
					{success ? <p className="success">{success}</p> : null}
					<div className="form-actions">
						<button type="submit" className="button" disabled={isSaving}>
							{isSaving ? "Saving..." : "Save Colors"}
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
