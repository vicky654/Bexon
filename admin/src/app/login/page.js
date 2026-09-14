"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import apiFetch from "@/lib/api";

const EyeIcon = () => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.8"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
		<circle cx="12" cy="12" r="3" />
	</svg>
);

const EyeOffIcon = () => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.8"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.3 21.3 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a21.4 21.4 0 0 1-2.66 3.79" />
		<path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
		<path d="M1 1l22 22" />
	</svg>
);

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
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
			router.push("/");
		} catch (err) {
			setError(err.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="auth-page">
			<div className="auth-card">
				<div className="auth-brand">
					<div className="auth-brand-mark">B</div>
					<div>
						<h1 className="auth-title">Bexon Admin</h1>
						<p className="auth-subtitle">Sign in to manage your site</p>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="auth-form">
					<div className="auth-field">
						<label htmlFor="email">Email address</label>
						<input
							id="email"
							type="email"
							placeholder="you@example.com"
							autoComplete="username"
							value={email}
							onChange={e => setEmail(e.target.value)}
							required
						/>
					</div>

					<div className="auth-field">
						<label htmlFor="password">Password</label>
						<div className="auth-password-wrap">
							<input
								id="password"
								type={showPassword ? "text" : "password"}
								placeholder="••••••••"
								autoComplete="current-password"
								value={password}
								onChange={e => setPassword(e.target.value)}
								required
							/>
							<button
								type="button"
								className="auth-password-toggle"
								onClick={() => setShowPassword(v => !v)}
								aria-label={showPassword ? "Hide password" : "Show password"}
								aria-pressed={showPassword}
								tabIndex={-1}
							>
								{showPassword ? <EyeOffIcon /> : <EyeIcon />}
							</button>
						</div>
					</div>

					{error ? <p className="auth-error">{error}</p> : null}

					<button type="submit" className="auth-submit" disabled={isSubmitting}>
						{isSubmitting ? "Signing in..." : "Sign in"}
					</button>
				</form>
			</div>
		</div>
	);
}
