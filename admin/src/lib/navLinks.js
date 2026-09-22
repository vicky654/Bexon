import {
	DashboardIcon,
	DocumentIcon,
	MailIcon,
	ImageIcon,
	BriefcaseIcon,
	InboxIcon,
	SettingsIcon,
} from "@/components/Icons";

export const NAV_LINKS = [
	{ href: "/", label: "Dashboard", Icon: DashboardIcon },
	{ href: "/blogs", label: "Blogs", Icon: DocumentIcon },
	{ href: "/messages", label: "Messages", Icon: MailIcon, badgeKey: "messages" },
	{ href: "/jobs", label: "Careers", Icon: BriefcaseIcon },
	{ href: "/applications", label: "Applications", Icon: InboxIcon, badgeKey: "applications" },
	{ href: "/logos", label: "Client Logos", Icon: ImageIcon },
	{ href: "/settings", label: "Settings", Icon: SettingsIcon },
];
