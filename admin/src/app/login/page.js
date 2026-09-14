"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import apiFetch from "@/lib/api";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async e => {
		e.preventDefault();
		setError("");
		setIsSubmitting(true);

		try {
			await apiFetch("/api/admin/login", {
				method: "POST",
				body: JSON.stringify({ email, password }),
			});
			router.push("/blogs");
		} catch (err) {
			setError(err.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="page page-narrow">
			<h1>Admin Login</h1>
			<form onSubmit={handleSubmit} className="form">
				<div className="form-field">
					<label htmlFor="email">Email</label>
					<input
						id="email"
						type="email"
						value={email}
						onChange={e => setEmail(e.target.value)}
						required
					/>
				</div>
				<div className="form-field">
					<label htmlFor="password">Password</label>
					<input
						id="password"
						type="password"
						value={password}
						onChange={e => setPassword(e.target.value)}
						required
					/>
				</div>
				{error ? <p className="error">{error}</p> : null}
				<button type="submit" className="button" disabled={isSubmitting}>
					{isSubmitting ? "Logging in..." : "Log in"}
				</button>
			</form>
		</div>
	);
}
