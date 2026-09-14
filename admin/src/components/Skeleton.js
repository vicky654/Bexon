export function SkeletonBlock({ width, height = "14px", className = "" }) {
	return (
		<span
			className={`skeleton ${className}`}
			style={{ width, height, display: "inline-block" }}
		/>
	);
}

export function SkeletonTableRows({ columns, rows = 5 }) {
	return (
		<>
			{Array.from({ length: rows }).map((_, rowIdx) => (
				<tr key={rowIdx}>
					{Array.from({ length: columns }).map((__, colIdx) => (
						<td key={colIdx}>
							<SkeletonBlock width={colIdx === 0 ? "70%" : "50%"} />
						</td>
					))}
				</tr>
			))}
		</>
	);
}

export function SkeletonStatCards({ count = 5 }) {
	return (
		<div className="stat-grid">
			{Array.from({ length: count }).map((_, idx) => (
				<div className="stat-card" key={idx}>
					<span className="skeleton skeleton-icon" />
					<div className="stat-card-body">
						<span className="skeleton" style={{ width: "40px", height: "22px" }} />
						<span className="skeleton" style={{ width: "70px", height: "11px", marginTop: "4px" }} />
					</div>
				</div>
			))}
		</div>
	);
}

export function SkeletonListRows({ count = 5 }) {
	return (
		<ul className="dashboard-list">
			{Array.from({ length: count }).map((_, idx) => (
				<li key={idx}>
					<span className="skeleton skeleton-avatar" />
					<div className="dashboard-list-main">
						<span className="skeleton" style={{ width: "60%", height: "13px" }} />
						<span className="skeleton" style={{ width: "40%", height: "11px", marginTop: "4px" }} />
					</div>
				</li>
			))}
		</ul>
	);
}
