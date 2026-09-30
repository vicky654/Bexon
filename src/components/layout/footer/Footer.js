import Link from "next/link";
import FooterSubscribeForm from "@/components/layout/footer/FooterSubscribeForm";
import { FOOTER_LINKS } from "@/content/navigation";

const Footer = () => {
	return (
		<footer className="tj-footer-section footer-1 page-footer">
			<div className="page-home-hero-bg" aria-hidden="true">
				<span className="page-home-hero-glow glow-1"></span>
				<span className="page-home-hero-glow glow-2"></span>
				<span className="page-home-hero-grid"></span>
			</div>
			<div className="footer-main-area">
				<div className="container">
					<div className="row justify-content-between">
						<div className="col-xl-3 col-lg-4 col-md-6">
							<div className="footer-widget wow fadeInUp" data-wow-delay=".1s">
								<div className="footer-logo page-footer-logo">
									<Link href="/">
										<img src="/images/logos/logo.webp" alt="DPDP Consultants" />
									</Link>
								</div>
								<div className="footer-text">
									<p>Empowering Privacy in Digital World. End-to-end DPDP Act consulting and automated compliance tools for organisations across India.</p>
								</div>
								<address className="page-footer-address">
									<i className="tji-location"></i>
									<span>GM IT Park, 4th Floor, Plot no 32-33, Sector 142, Noida 201305, Uttar Pradesh</span>
								</address>
							</div>
						</div>
						{FOOTER_LINKS.map((group, idx) => (
							<div key={group.heading} className="col-xl-2 col-lg-4 col-md-6">
								<div
									className="footer-widget widget-nav-menu wow fadeInUp"
									data-wow-delay={`.${3 + idx * 2}s`}
								>
									<h5 className="title">{group.heading}</h5>
									<ul>
										{group.links.map(link => (
											<li key={link.href}>
												<Link href={link.href}>{link.label}</Link>
											</li>
										))}
									</ul>
								</div>
							</div>
						))}
						<div className="col-xl-3 col-lg-5 col-md-6">
							<div
								className="footer-widget widget-subscribe wow fadeInUp"
								data-wow-delay=".9s"
							>
								<h3 className="title">Subscribe to Our Newsletter.</h3>
								<div className="subscribe-form">
									<FooterSubscribeForm />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="tj-copyright-area">
				<div className="container">
					<div className="row">
						<div className="col-12">
							<div className="copyright-content-area">
								<div className="footer-contact">
									<ul>
										<li>
											<Link href="tel:0120-6930999">
												<span className="icon">
													<i className="tji-phone-2"></i>
												</span>
												<span className="text">0120-6930999</span>
											</Link>
										</li>
										<li>
											<Link href="tel:1800-5711333">
												<span className="icon">
													<i className="tji-phone-2"></i>
												</span>
												<span className="text">1800-5711333</span>
											</Link>
										</li>
										<li>
											<Link href="mailto:info@dpdpconsultants.com">
												<span className="icon">
													<i className="tji-envelop-2"></i>
												</span>
												<span className="text">info@dpdpconsultants.com</span>
											</Link>
										</li>
									</ul>
								</div>
								<div className="social-links">
									<ul>
										<li>
											<Link href="https://www.facebook.com/profile.php?id=61561140562760" target="_blank">
												<i className="fa-brands fa-facebook-f"></i>
											</Link>
										</li>
										<li>
											<Link href="https://www.instagram.com/dpdp.consultants/" target="_blank">
												<i className="fa-brands fa-instagram"></i>
											</Link>
										</li>
										<li>
											<Link href="https://x.com/socialdpdp43979" target="_blank">
												<i className="fa-brands fa-x-twitter"></i>
											</Link>
										</li>
										<li>
											<Link href="https://www.linkedin.com/company/dpdpconsultants/" target="_blank">
												<i className="fa-brands fa-linkedin-in"></i>
											</Link>
										</li>
										<li>
											<Link href="https://www.youtube.com/@DPDPConsultants" target="_blank">
												<i className="fa-brands fa-youtube"></i>
											</Link>
										</li>
										<li>
											<Link href="https://www.quora.com/profile/DPDP-Consultants" target="_blank">
												<i className="fa-brands fa-quora"></i>
											</Link>
										</li>
										<li>
											<Link href="https://pin.it/1nhQ1Ugv0" target="_blank">
												<i className="fa-brands fa-pinterest-p"></i>
											</Link>
										</li>
									</ul>
								</div>
								<div className="copyright-text">
									<p>
									&copy; {new Date().getFullYear()} DPDP Consultants (Privacyium Tech Pvt. Ltd.) - All rights reserved
								</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
