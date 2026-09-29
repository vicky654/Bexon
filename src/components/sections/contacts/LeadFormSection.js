"use client";
import ContactFormBody from "@/components/sections/contacts/ContactFormBody";
import useContactForm from "@/hooks/useContactForm";
import { leadForm } from "@/libs/leadForms";
import Link from "next/link";

const LeadFormSection = ({ type, eyebrow, title, intro, points = [] }) => {
	const form = useContactForm(type);

	return (
		<section className="tj-lead-form-section section-gap">
			<div className="container">
				<div className="row align-items-start">
					<div className="col-lg-5">
						<div className="lead-form-intro">
							<div className="sec-heading wow fadeInUp" data-wow-delay=".1s">
								{eyebrow ? (
									<span className="sub-title">
										<i className="tji-box"></i>
										{eyebrow}
									</span>
								) : null}
								<h2 className="sec-title lead-form-title">{title}</h2>
							</div>
							<p className="lead-form-desc wow fadeInUp" data-wow-delay=".2s">
								{intro}
							</p>
							{points.length ? (
								<ul className="lead-form-points wow fadeInUp" data-wow-delay=".3s">
									{points.map(point => (
										<li key={point}>
											<span className="lead-form-point-icon">
												<i className="tji-check"></i>
											</span>
											{point}
										</li>
									))}
								</ul>
							) : null}
							<div className="lead-form-contact wow fadeInUp" data-wow-delay=".4s">
								<p className="lead-form-contact-label">Prefer to talk to us directly?</p>
								<Link className="lead-form-contact-item" href="mailto:info@dpdpconsultants.com">
									<span className="lead-form-contact-icon">
										<i className="tji-chat"></i>
									</span>
									info@dpdpconsultants.com
								</Link>
								<Link className="lead-form-contact-item" href="tel:1800-5711333">
									<span className="lead-form-contact-icon">
										<i className="tji-phone"></i>
									</span>
									1800-5711333 (Toll free)
								</Link>
							</div>
						</div>
					</div>
					<div className="col-lg-7">
						<div className="contact-form lead-form-card wow fadeInUp" data-wow-delay=".2s">
							<form onSubmit={form.handleSubmit} noValidate>
								<ContactFormBody form={form} submitText={leadForm(type).submitText} />
							</form>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default LeadFormSection;
