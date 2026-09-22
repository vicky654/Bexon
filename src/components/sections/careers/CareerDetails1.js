"use client";

import { useState } from "react";
import Link from "next/link";
import ButtonPrimary from "@/components/shared/buttons/ButtonPrimary";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

function formatDate(value) {
	if (!value) return "";
	try {
		return new Date(value).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	} catch {
		return "";
	}
}

function TextBlock({ text }) {
	if (!text) return null;
	const paragraphs = text.split(/\n+/).filter(Boolean);
	return (
		<>
			{paragraphs.map((paragraph, idx) => (
				<p key={idx} className="wow fadeInUp" data-wow-delay={`${0.1 + idx * 0.1}s`}>
					{paragraph}
				</p>
			))}
		</>
	);
}

const CareerDetails1 = ({ job, prevJob, nextJob }) => {
	const {
		id,
		title,
		iconName,
		type,
		department,
		location,
		salaryRange,
		salaryPeriod,
		description,
		requirements,
		createdAt,
	} = job || {};

	const [values, setValues] = useState({ name: "", email: "", phone: "", coverLetter: "" });
	const [resumeFile, setResumeFile] = useState(null);
	const [status, setStatus] = useState("idle");
	const [error, setError] = useState("");

	const handleChange = e => {
		const { name, value } = e.target;
		setValues(prev => ({ ...prev, [name]: value }));
	};

	const handleFileChange = e => {
		setResumeFile(e.target.files?.[0] || null);
	};

	const handleSubmit = async e => {
		e.preventDefault();
		setError("");
		setStatus("submitting");

		try {
			const formData = new FormData();
			formData.append("name", values.name);
			formData.append("email", values.email);
			formData.append("phone", values.phone);
			formData.append("coverLetter", values.coverLetter);
			if (resumeFile) formData.append("resume", resumeFile);

			const res = await fetch(`/api/jobs/${id}/apply`, {
				method: "POST",
				body: formData,
			});
			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				throw new Error(data.message || "Failed to submit application.");
			}

			setStatus("success");
			setValues({ name: "", email: "", phone: "", coverLetter: "" });
			setResumeFile(null);
		} catch (err) {
			setError(err.message);
			setStatus("error");
		}
	};

	return (
		<section className="tj-careers-details section-gap">
			<div className="container">
				<div className="row rg-50">
					<div className="col-lg-8">
						<div className="tj-post-wrapper">
							<div className="tj-post-single-post">
								{/* <!-- top content --> */}
								<div className="tj-careers-top mb-30">
									<div className="tj-careers-top-icon">
										<i className={iconName ? iconName : "tji-manage"}></i>
									</div>
									<div className="tj-careers-top-content">
										<div className="tj-careers-tag">
											{type ? <span>{type}</span> : null}
											{department ? <span>{department}</span> : null}
										</div>
										<h3 className="tj-careers-top-title text-anim">{title}</h3>
										{location ? (
											<span className="location">
												<i className="tji-location"></i>
												{location}
											</span>
										) : null}
									</div>
								</div>
								{/* <!-- content --> */}
								<div className="tj-entry-content">
									{description ? (
										<>
											<h4 className="text-anim">Job Description</h4>
											<TextBlock text={description} />
										</>
									) : null}
									{requirements ? (
										<div className="tj-check-list">
											<h4 className="text-anim">Requirements</h4>
											<TextBlock text={requirements} />
										</div>
									) : null}
								</div>
							</div>

							{/* <!-- post navigation --> */}
							<div className="tj-post__navigation mb-0 wow fadeInUp" data-wow-delay="0.3s">
								<div className="tj-nav__post previous" style={{ visibility: prevJob ? "visible" : "hidden" }}>
									<div className="tj-nav-post__nav prev_post">
										<Link href={prevJob ? `/careers/${prevJob.id}` : "#"}>
											<span>
												<i className="tji-arrow-left"></i>
											</span>
											Previous
										</Link>
									</div>
								</div>
								<Link href={"/careers"} className="tj-nav-post__grid">
									<i className="tji-window"></i>
								</Link>
								<div className="tj-nav__post next" style={{ visibility: nextJob ? "visible" : "hidden" }}>
									<div className="tj-nav-post__nav next_post">
										<Link href={nextJob ? `/careers/${nextJob.id}` : "#"}>
											Next
											<span>
												<i className="tji-arrow-right"></i>
											</span>
										</Link>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="col-lg-4">
						<aside className="tj-blog-sidebar">
							{/* <!-- Job information  --> */}
							<div className="tj-sidebar-widget wow fadeInUp" data-wow-delay="0.1s">
								<h4 className="widget-title">Job Information</h4>
								<div className="project_catagory">
									<ul>
										<li>
											<span className="first-child">Type</span>
											<span>{type || "—"}</span>
										</li>
										<li>
											<span className="first-child">Department</span>
											<span>{department || "—"}</span>
										</li>
										<li>
											<span className="first-child">Company</span>
											<span>DPDP Consultants</span>
										</li>
										{SITE_URL ? (
											<li>
												<span className="first-child">Website</span>
												<span>{SITE_URL.replace(/^https?:\/\//, "")}</span>
											</li>
										) : null}
										<li>
											<span className="first-child">Salary</span>
											<span>
												{salaryRange ? `${salaryRange} / ${salaryPeriod || "year"}` : "Not disclosed"}
											</span>
										</li>
										<li>
											<span className="first-child">Posted on</span>
											<span>{formatDate(createdAt)}</span>
										</li>
									</ul>
								</div>
							</div>
							{/* <!-- apply form --> */}
							<div className="tj-sidebar-widget wow fadeInUp" data-wow-delay="0.3s">
								<h4 className="widget-title">Apply Online</h4>
								<div className="tj-careers-form">
									{status === "success" ? (
										<p>Thanks for applying! We&apos;ll be in touch if there&apos;s a match.</p>
									) : (
										<form onSubmit={handleSubmit}>
											<div className="form-input">
												<input
													type="text"
													name="name"
													placeholder="Full name*"
													value={values.name}
													onChange={handleChange}
													required
												/>
											</div>
											<div className="form-input">
												<input
													type="email"
													name="email"
													placeholder="Enter email*"
													value={values.email}
													onChange={handleChange}
													required
												/>
											</div>
											<div className="form-input">
												<input
													type="text"
													name="phone"
													placeholder="Phone number*"
													value={values.phone}
													onChange={handleChange}
													required
												/>
											</div>
											<div className="form-input">
												<textarea
													name="coverLetter"
													placeholder="Cover letter*"
													value={values.coverLetter}
													onChange={handleChange}
													required
												></textarea>
											</div>
											<div className="form-input reduce">
												<label className="label" htmlFor="inputFile">
													Attach resume*
												</label>
												<input
													type="file"
													id="inputFile"
													accept=".pdf,.doc,.docx"
													onChange={handleFileChange}
													required
												/>
											</div>
											{error ? <p className="form-error">{error}</p> : null}
											<div className="tj-careers-button">
												<ButtonPrimary
													text={status === "submitting" ? "Submitting..." : "Submit now"}
													type="submit"
													disabled={status === "submitting"}
												/>
											</div>
										</form>
									)}
								</div>
							</div>
						</aside>
					</div>
				</div>
			</div>
		</section>
	);
};

export default CareerDetails1;
