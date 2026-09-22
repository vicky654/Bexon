"use client";

import { useEffect, useRef, useState } from "react";
import apiFetch from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SkeletonLogoGrid } from "@/components/Skeleton";
import { UploadIcon, TrashIcon, GripIcon, CheckIcon } from "@/components/Icons";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

function AlertIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
			<circle cx="12" cy="12" r="10" />
			<line x1="12" y1="8" x2="12" y2="13" />
			<line x1="12" y1="16" x2="12" y2="16.01" />
		</svg>
	);
}

function LogosManager() {
	const [logos, setLogos] = useState(null);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [isUploading, setIsUploading] = useState(false);
	const [isDropzoneActive, setIsDropzoneActive] = useState(false);
	const [draggedId, setDraggedId] = useState(null);
	const fileInputRef = useRef(null);

	const loadLogos = () => {
		apiFetch("/api/admin/brand-logos")
			.then(data => setLogos(data.logos || []))
			.catch(err => setError(err.message));
	};

	useEffect(() => {
		loadLogos();
	}, []);

	const uploadFiles = async fileList => {
		const files = Array.from(fileList || []).filter(file => file.type.startsWith("image/"));
		if (!files.length) return;

		setError("");
		setSuccess("");
		setIsUploading(true);

		try {
			for (const file of files) {
				const formData = new FormData();
				formData.append("image", file);
				const res = await fetch(`${BACKEND_URL}/api/admin/upload`, {
					method: "POST",
					credentials: "include",
					body: formData,
				});
				const data = await res.json().catch(() => ({}));
				if (!res.ok) {
					throw new Error(data.message || `Failed to upload ${file.name}`);
				}

				const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
				await apiFetch("/api/admin/brand-logos", {
					method: "POST",
					body: JSON.stringify({ imageUrl: `${BACKEND_URL}${data.url}`, alt }),
				});
			}
			setSuccess(`Uploaded ${files.length} logo${files.length === 1 ? "" : "s"}.`);
			loadLogos();
		} catch (err) {
			setError(err.message);
		} finally {
			setIsUploading(false);
		}
	};

	const handleDropzoneDrop = e => {
		e.preventDefault();
		setIsDropzoneActive(false);
		uploadFiles(e.dataTransfer.files);
	};

	const handleFileInputChange = e => {
		uploadFiles(e.target.files);
		e.target.value = "";
	};

	const handleDelete = async id => {
		if (!confirm("Delete this logo?")) return;
		try {
			await apiFetch(`/api/admin/brand-logos/${id}`, { method: "DELETE" });
			setLogos(prev => prev.filter(logo => logo.id !== id));
		} catch (err) {
			setError(err.message);
		}
	};

	const handleAltChange = (id, value) => {
		setLogos(prev => prev.map(logo => (logo.id === id ? { ...logo, alt: value } : logo)));
	};

	const handleAltBlur = async (id, alt) => {
		try {
			await apiFetch(`/api/admin/brand-logos/${id}`, {
				method: "PUT",
				body: JSON.stringify({ alt }),
			});
		} catch (err) {
			setError(err.message);
		}
	};

	const persistOrder = async orderedLogos => {
		try {
			await apiFetch("/api/admin/brand-logos/reorder", {
				method: "PUT",
				body: JSON.stringify({ ids: orderedLogos.map(logo => logo.id) }),
			});
		} catch (err) {
			setError(err.message);
		}
	};

	const handleCardDragStart = id => {
		setDraggedId(id);
	};

	const handleCardDragOver = (e, overId) => {
		e.preventDefault();
		if (draggedId === null || draggedId === overId) return;
		setLogos(prev => {
			const draggedIndex = prev.findIndex(logo => logo.id === draggedId);
			const overIndex = prev.findIndex(logo => logo.id === overId);
			if (draggedIndex === -1 || overIndex === -1) return prev;
			const next = [...prev];
			const [moved] = next.splice(draggedIndex, 1);
			next.splice(overIndex, 0, moved);
			return next;
		});
	};

	const handleCardDragEnd = () => {
		setDraggedId(null);
		if (logos) persistOrder(logos);
	};

	const isLoading = logos === null;

	return (
		<div>
			<Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Client Logos" }]} />
			<div className="page-header">
				<div>
					<h1>Client Logos</h1>
					<p className="dashboard-subtitle">
						{isLoading ? "Loading..." : `${logos.length} logo${logos.length === 1 ? "" : "s"} shown on the public site`}
					</p>
				</div>
			</div>

			<label
				className={`logo-dropzone${isDropzoneActive ? " logo-dropzone-active" : ""}`}
				onDragOver={e => {
					e.preventDefault();
					setIsDropzoneActive(true);
				}}
				onDragLeave={() => setIsDropzoneActive(false)}
				onDrop={handleDropzoneDrop}
			>
				<UploadIcon size={22} />
				<p>
					<strong>Drag and drop</strong> logo images here, or click to browse
				</p>
				<span className="logo-dropzone-hint">PNG, JPG, WEBP, GIF or SVG</span>
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					multiple
					className="editor-file-input"
					onChange={handleFileInputChange}
					disabled={isUploading}
				/>
			</label>

			{isUploading ? <p className="dashboard-subtitle">Uploading...</p> : null}

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

			{isLoading ? (
				<SkeletonLogoGrid />
			) : logos.length ? (
				<div className="logo-grid">
					{logos.map(logo => (
						<div
							key={logo.id}
							className={`logo-card${draggedId === logo.id ? " logo-card-dragging" : ""}`}
							draggable
							onDragStart={() => handleCardDragStart(logo.id)}
							onDragOver={e => handleCardDragOver(e, logo.id)}
							onDragEnd={handleCardDragEnd}
						>
							<div className="logo-card-handle" title="Drag to reorder">
								<GripIcon size={14} />
							</div>
							<div className="logo-card-preview">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={logo.imageUrl} alt={logo.alt || "Client logo"} />
							</div>
							<input
								className="logo-card-alt"
								value={logo.alt}
								placeholder="Company name"
								onChange={e => handleAltChange(logo.id, e.target.value)}
								onBlur={e => handleAltBlur(logo.id, e.target.value)}
							/>
							<button
								type="button"
								className="logo-card-delete"
								onClick={() => handleDelete(logo.id)}
								aria-label="Delete logo"
							>
								<TrashIcon size={14} />
							</button>
						</div>
					))}
				</div>
			) : (
				<p className="dashboard-empty">No logos yet. Drag some images in above to get started.</p>
			)}
		</div>
	);
}

export default function LogosPage() {
	return (
		<RequireAuth>
			<LogosManager />
		</RequireAuth>
	);
}
