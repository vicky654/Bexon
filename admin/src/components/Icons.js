function Svg({ children, size = 18, ...rest }) {
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
			{...rest}
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

export const SettingsIcon = props => (
	<Svg {...props}>
		<circle cx="12" cy="12" r="3" />
		<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
	</Svg>
);

export const ChevronDownIcon = props => (
	<Svg {...props}>
		<path d="m6 9 6 6 6-6" />
	</Svg>
);

export const MenuIcon = props => (
	<Svg {...props}>
		<path d="M4 6h16M4 12h16M4 18h16" />
	</Svg>
);

export const BellIcon = props => (
	<Svg {...props}>
		<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
		<path d="M13.73 21a2 2 0 0 1-3.46 0" />
	</Svg>
);

export const GripIcon = props => (
	<Svg {...props} fill="currentColor" stroke="none">
		<circle cx="9" cy="6" r="1.5" />
		<circle cx="15" cy="6" r="1.5" />
		<circle cx="9" cy="12" r="1.5" />
		<circle cx="15" cy="12" r="1.5" />
		<circle cx="9" cy="18" r="1.5" />
		<circle cx="15" cy="18" r="1.5" />
	</Svg>
);

export const ImageIcon = props => (
	<Svg {...props}>
		<rect x="3" y="3" width="18" height="18" rx="2" />
		<circle cx="9" cy="9" r="2" />
		<path d="m21 15-5-5L5 21" />
	</Svg>
);
