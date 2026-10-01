import { Mona_Sans } from "next/font/google";
import "./globals.css";
import "./admin-theme.css";

// Same typeface as the public website.
const monaSans = Mona_Sans({ variable: "--font-mona", subsets: ["latin"], display: "swap" });

export const metadata = {
	title: "DPDP Admin",
	description: "Manage blog posts and contact submissions.",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en" className={monaSans.variable}>
			<body>{children}</body>
		</html>
	);
}
