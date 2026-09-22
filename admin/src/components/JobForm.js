"use client";

import { useState } from "react";
import AiDraftPanel from "./AiDraftPanel";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Remote"];

const initialState = {
	title: "",
	department: "",
	location: "",
	type: "Full-time",
	salaryRange: "",
	salaryPeriod: "year",
	description: "",
	requirements: "",
	published: true,
};

export default function JobForm({ initialValues, onSubmit, submitLabel }) {
	const [values, setValues] = useState({ ...initialState, ...initialValues });
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleChange = e => {
		const { name, value, type, checked } = e.target;
		setValues(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
	};

	const handleSubmit = async e => {
		e.preventDefault();
		setError("");
		setIsSubmitting(true);

		try {
			await onSubmit(values);
		} catch (err) {
			setError(err.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleAiGenerated = result => {
		setValues(prev => ({
			...prev,
			title: result.title || prev.title,
			description: result.description || prev.description,
			requirements: result.requirements || prev.requirements,
		}));
	};

	return (
		<form onSubmit={handleSubmit} className="form">
			<AiDraftPanel
				type="job"
				onGenerated={handleAiGenerated}
				placeholder="e.g. Senior Privacy Consultant with DPDP Act experience"
				hasExistingContent={Boolean(values.description || values.requirements)}
			/>

			<div className="form-row">
				<div className="form-field">
					<label htmlFor="title">Job Title</label>
					<input
						id="title"
						name="title"
						value={values.title}
						onChange={handleChange}
						placeholder="e.g. Senior Privacy Consultant"
						required
					/>
				</div>
				<div className="form-field">
					<label htmlFor="department">Department</label>
					<input
						id="department"
						name="department"
						value={values.department}
						onChange={handleChange}
						placeholder="e.g. Legal & Compliance"
					/>
				</div>
			</div>

			<div className="form-row">
				<div className="form-field">
					<label htmlFor="location">Location</label>
					<input
						id="location"
						name="location"
						value={values.location}
						onChange={handleChange}
						placeholder="e.g. Gurugram, India / Remote"
					/>
				</div>
				<div className="form-field">
					<label htmlFor="type">Job Type</label>
					<select id="type" name="type" value={values.type} onChange={handleChange}>
						{JOB_TYPES.map(type => (
							<option key={type} value={type}>
								{type}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="form-row">
				<div className="form-field">
					<label htmlFor="salaryRange">Salary (optional)</label>
					<input
						id="salaryRange"
						name="salaryRange"
						value={values.salaryRange}
						onChange={handleChange}
						placeholder="e.g. ₹8-12 LPA, or leave blank"
					/>
				</div>
				<div className="form-field">
					<label htmlFor="salaryPeriod">Per</label>
					<select id="salaryPeriod" name="salaryPeriod" value={values.salaryPeriod} onChange={handleChange}>
						<option value="year">Year</option>
						<option value="month">Month</option>
						<option value="week">Week</option>
						<option value="hour">Hour</option>
					</select>
				</div>
			</div>

			<div className="form-field">
				<label htmlFor="description">Job Description</label>
				<textarea
					id="description"
					name="description"
					rows={5}
					value={values.description}
					onChange={handleChange}
					placeholder="Describe the role, responsibilities, and what the day-to-day looks like."
				/>
			</div>

			<div className="form-field">
				<label htmlFor="requirements">Requirements</label>
				<textarea
					id="requirements"
					name="requirements"
					rows={5}
					value={values.requirements}
					onChange={handleChange}
					placeholder="List the skills, experience, and qualifications needed. One per line works well."
				/>
			</div>

			<div className="form-field form-field-checkbox">
				<label htmlFor="published" className="form-checkbox-label">
					<input
						id="published"
						name="published"
						type="checkbox"
						checked={values.published}
						onChange={handleChange}
					/>
					Published (visible on the careers page)
				</label>
			</div>

			{error ? <p className="error">{error}</p> : null}

			<div className="form-actions">
				<button type="submit" className="button" disabled={isSubmitting}>
					{isSubmitting ? "Saving..." : submitLabel}
				</button>
			</div>
		</form>
	);
}
