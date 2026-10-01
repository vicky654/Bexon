"use client";
import Link from "next/link";

const ContactMenu = ({ isContactOpen, setIsContactOpen }) => {
	const handleClick = () => {
		setIsContactOpen(false);
	};
	return (
		<>
			<div
				className={`body-overlay  ${isContactOpen ? "opened" : ""}`}
				onClick={handleClick}
			></div>
			<div
				className={`tj-offcanvas-area d-none d-lg-block  ${
					isContactOpen ? "opened" : ""
				}`}
			>
				<div className="hamburger_bg"></div>
				<div className="hamburger_wrapper">
					<div className="hamburger_inner">
						<div className="hamburger_top d-flex align-items-center justify-content-between">
							<div className="hamburger_logo">
								<Link href="/" className="mobile_logo">
									<img src="/images/logos/logo-2.webp" alt="Logo" />
								</Link>
							</div>
							<div className="hamburger_close">
								<button className="hamburger_close_btn" onClick={handleClick}>
									<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
								</button>
							</div>
						</div>
						<div className="hamburger-search-area">
							<h5 className="hamburger-title">Search Now!</h5>
							<div className="hamburger_search">
								<form method="get" action="/">
									<button type="submit">
										<i className="tji-search"></i>
									</button>
									<input
										type="search"
										autoComplete="off"
										name="s"
										placeholder="Search here..."
									/>
								</form>
							</div>
						</div>
						<div className="hamburger-infos">
							<h5 className="hamburger-title">Contact Info</h5>
							<div className="contact-info">
								<div className="contact-item">
									<span className="subtitle">Phone</span>
									<Link className="contact-link" href="tel:0120-6930999">
										0120-6930999
									</Link>
									<Link className="contact-link" href="tel:1800-5711333">
										1800-5711333
									</Link>
								</div>
								<div className="contact-item">
									<span className="subtitle">Email</span>
									<Link className="contact-link" href="mailto:info@dpdpconsultants.com">
										info@dpdpconsultants.com
									</Link>
								</div>
								<div className="contact-item">
									<span className="subtitle">Location</span>
									<span className="contact-link">
										GM IT Park, 4th Floor, Plot no 32-33, Sector 142, Noida 201305, Uttar Pradesh
									</span>
								</div>
							</div>
						</div>
					</div>
					<div className="hamburger-socials">
						<h5 className="hamburger-title">Follow Us</h5>
						<div className="social-links style-3">
							<ul>
								<li>
									<a href="https://www.facebook.com/profile.php?id=61561140562760" target="_blank">
										<i className="fa-brands fa-facebook-f"></i>
									</a>
								</li>
								<li>
									<a href="https://www.instagram.com/dpdp.consultants/" target="_blank">
										<i className="fa-brands fa-instagram"></i>
									</a>
								</li>
								<li>
									<a href="https://x.com/socialdpdp43979" target="_blank">
										<i className="fa-brands fa-x-twitter"></i>
									</a>
								</li>
								<li>
									<a href="https://www.linkedin.com/company/dpdpconsultants/" target="_blank">
										<i className="fa-brands fa-linkedin-in"></i>
									</a>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default ContactMenu;
