"use client";

import React, { useEffect, useState } from "react";

const ComingSoonPrimary = ({
	targetDate = "2026-12-31 12:00:00",
	labels = {
		day: "Days",
		hour: "Hours",
		min: "Mins",
		sec: "Sec",
	},
	backgroundImage = "/images/bg/coming-soon-bg.webp",
}) => {
	const [timeLeft, setTimeLeft] = useState({
		days: "00",
		hours: "00",
		minutes: "00",
		seconds: "00",
	});

	useEffect(() => {
		const targetTime = new Date(targetDate).getTime();

		if (isNaN(targetTime)) return;

		const pad = value => String(value).padStart(2, "0");

		const updateCountdown = () => {
			const diff = targetTime - Date.now();

			if (diff <= 0) {
				setTimeLeft({
					days: "00",
					hours: "00",
					minutes: "00",
					seconds: "00",
				});
				return;
			}

			const days = Math.floor(diff / (1000 * 60 * 60 * 24));
			const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
			const minutes = Math.floor((diff / (1000 * 60)) % 60);
			const seconds = Math.floor((diff / 1000) % 60);

			setTimeLeft({
				days: pad(days),
				hours: pad(hours),
				minutes: pad(minutes),
				seconds: pad(seconds),
			});
		};

		updateCountdown();

		const timer = setInterval(updateCountdown, 1000);

		return () => clearInterval(timer);
	}, [targetDate]);

	const countdownItems = [
		{
			key: "days",
			value: timeLeft.days,
			label: labels.day,
		},
		{
			key: "hours",
			value: timeLeft.hours,
			label: labels.hour,
		},
		{
			key: "minutes",
			value: timeLeft.minutes,
			label: labels.min,
		},
		{
			key: "seconds",
			value: timeLeft.seconds,
			label: labels.sec,
		},
	];

	return (
		<section className="tj-coming-soon-section">
			<div
				className="tj_coming_soon"
				style={{
					backgroundImage: `url(${backgroundImage})`,
				}}
			>
				<div className="tj_coming_soon_wrap">
					<div className="tj_coming_soon_content">
						<h1 className="title">Coming Soon</h1>

						<div className="desc">
							Our new website is under development — smarter, faster, and more
							creative than ever.
						</div>
					</div>

					<div className="countdown">
						{countdownItems.map((item, index) => (
							<React.Fragment key={item.key}>
								<div className={`countdown-container ${item.key}`}>
									<span className="countdown-value">{item.value}</span>

									<span className="countdown-heading">{item.label}</span>
								</div>

								{index !== countdownItems.length - 1 && (
									<span className="divider">:</span>
								)}
							</React.Fragment>
						))}
					</div>

					<div className="query_form">
						<form
							onSubmit={e => {
								e.preventDefault();
							}}
						>
							<input
								type="email"
								name="email"
								placeholder="Enter email address"
								required
							/>

							<button type="submit">
								<i className="tj tji-plane"></i>
							</button>
						</form>

						<span className="form_note">* Join the launch list here.</span>
					</div>
				</div>
			</div>
		</section>
	);
};
export default ComingSoonPrimary;
