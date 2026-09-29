"use client";
import ContactFormBody from "@/components/sections/contacts/ContactFormBody";
import useContactForm from "@/hooks/useContactForm";
import Link from "next/link";

const Contact2 = () => {
	const form = useContactForm("contact");

	return (
		<section className="tj-contact-section section-gap section-gap-x">
			<div className="container">
				<div className="row">
					<div className="col-lg-6">
						<div className="global-map wow fadeInUp" data-wow-delay=".3s">
							<div className="global-map-img">
								<img src="/images/bg/map.svg" alt="Image" />
								<div className="location-indicator loc-1">
									<div className="location-tooltip">
										<span>Head office:</span>
										<p>GM IT Park, 4th Floor, Plot no 32-33, Sector 142, Noida 201305, Uttar Pradesh</p>
										<Link href="tel:10095447818">P: +1 (009) 544-7818</Link>
										<Link href="mailto:info@dpdpconsultants.com">
											M: info@dpdpconsultants.com
										</Link>
									</div>
								</div>
								<div className="location-indicator loc-2">
									<div className="location-tooltip">
										<span>Regional office:</span>
										<p>Hessisch Lichtenau 37235, Kassel, Germany.</p>
										<Link href="tel:10098801810">P: +1 (009) 880-1810</Link>
										<Link href="mailto:info@dpdpconsultants.com">
											M: info@dpdpconsultants.com
										</Link>
									</div>
								</div>
								<div className="location-indicator loc-3">
									<div className="location-tooltip">
										<span>Regional office:</span>
										<p>32 Altamira, State of Pará, Brazil.</p>
										<Link href="tel:10095447818">P: +1 (009) 544-7818</Link>
										<Link href="mailto:info@dpdpconsultants.com">
											M: info@dpdpconsultants.com
										</Link>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="col-lg-6">
						<div
							className="contact-form style-2 wow fadeInUp"
							data-wow-delay=".4s"
						>
							<div className="sec-heading">
								<span className="sub-title text-white">
									<i className="tji-box"></i>Get in Touch
								</span>
								<h2 className="sec-title title-anim">
									Drop Us a <span>Line.</span>
								</h2>
							</div>
							<form id="contact-form-2" onSubmit={form.handleSubmit} noValidate>
								<div className="wow fadeInUp" data-wow-delay=".5s">
									<ContactFormBody form={form} submitText={"Send Message"} />
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
			<div className="bg-shape-1">
				<img src="/images/shape/pattern-2.svg" alt="" />
			</div>
			<div className="bg-shape-2">
				<img src="/images/shape/pattern-3.svg" alt="" />
			</div>
		</section>
	);
};

export default Contact2;
