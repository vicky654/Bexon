import "./globals.css";

export const metadata = {
	title: "DPDP Admin",
	description: "Manage blog posts and contact submissions.",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
