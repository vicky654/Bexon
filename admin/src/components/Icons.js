function Svg({ children, size = 18 }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			{children}
		</svg>
	);
}

export const DashboardIcon = props => (
	<Svg {...props}>
		<rect x="3" y="3" width="7" height="9" rx="1.5" />
		<rect x="14" y="3" width="7" height="5" rx="1.5" />
		<rect x="14" y="12" width="7" height="9" rx="1.5" />
		<rect x="3" y="16" width="7" height="5" rx="1.5" />
	</Svg>
);

export const DocumentIcon = props => (
	<Svg {...props}>
		<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
		<path d="M14 2v6h6" />
		<path d="M9 13h6M9 17h6" />
	</Svg>
);

export const MailIcon = props => (
	<Svg {...props}>
		<path d="M4 4h16v14H8l-4 4Z" />
	</Svg>
);

export const ExternalLinkIcon = props => (
	<Svg {...props}>
		<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
		<path d="M15 3h6v6" />
		<path d="M10 14 21 3" />
	</Svg>
);

export const LogoutIcon = props => (
	<Svg {...props}>
		<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
		<path d="M16 17l5-5-5-5" />
		<path d="M21 12H9" />
	</Svg>
);

export const EyeIcon = props => (
	<Svg {...props}>
		<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
		<circle cx="12" cy="12" r="3" />
	</Svg>
);

export const PencilIcon = props => (
	<Svg {...props}>
		<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
	</Svg>
);

export const TrashIcon = props => (
	<Svg {...props}>
		<path d="M3 6h18" />
		<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
		<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
		<path d="M10 11v6M14 11v6" />
	</Svg>
);

export const CheckIcon = props => (
	<Svg {...props}>
		<path d="m4 12 6 6 10-12" />
	</Svg>
);

export const DownloadIcon = props => (
	<Svg {...props}>
		<path d="M12 3v12" />
		<path d="m7 10 5 5 5-5" />
		<path d="M5 21h14" />
	</Svg>
);

export const UploadIcon = props => (
	<Svg {...props}>
		<path d="M12 21V9" />
		<path d="m7 14 5-5 5 5" />
		<path d="M5 3h14" />
	</Svg>
);
