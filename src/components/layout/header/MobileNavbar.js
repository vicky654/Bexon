import { NAVIGATION } from "@/content/navigation";
import Link from "next/link";
import MobileMenuItem from "./MobileMenuItem";

const MobileNavbar = () => {
	return (
		<div className="hamburger_menu">
			<div className="mobile_menu mean-container">
				<div className="mean-bar">
					<Link
						href="#nav"
						className="meanmenu-reveal"
						style={{ right: 0, left: "auto" }}
					>
						<span>
							<span>
								<span></span>
							</span>
						</span>
					</Link>
					<nav className="mean-nav">
						<ul>
							{NAVIGATION.map(item =>
								item.children ? (
									<MobileMenuItem key={item.label} text={item.label} url={item.href}>
										{item.children.map(child => (
											<li key={child.href + child.label}>
												<Link href={child.href}>{child.label}</Link>
											</li>
										))}
									</MobileMenuItem>
								) : (
									<li key={item.label}>
										<Link href={item.href}>{item.label}</Link>
									</li>
								)
							)}
						</ul>
					</nav>
				</div>
			</div>
		</div>
	);
};

export default MobileNavbar;
