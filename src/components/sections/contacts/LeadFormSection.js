"use client";
import ContactFormBody from "@/components/sections/contacts/ContactFormBody";
import useContactForm from "@/hooks/useContactForm";
import { leadForm } from "@/libs/leadForms";
import Link from "next/link";

const LeadFormSection = ({ type, title, intro, points = [] }) => {
	const form = useContactForm(type);

	return (
		<section className="tj-contact-section-2 section-bottom-gap">
			<div className="container">
				<div className="row">
					<div className="col-lg-5">
						<div className="sec-heading wow fadeInUp" data-wow-delay=".1s">
							<h2 className="sec-title title-anim">{title}</h2>
						</div>
						<p className="wow fadeInUp" data-wow-delay=".2s">{intro}</p>
						{points.length ? (
							<ul className="wow fadeInUp" data-wow-delay=".3s">
								{points.map(point => (
									<li key={point}>{point}</li>
								))}
							</ul>
						) : null}
						<p className="mt-4 wow fadeInUp" data-wow-delay=".4s">
							Prefer email? Write to{" "}
							<Link href="mailto:info@dpdpconsultants.com">info@dpdpconsultants.com</Link> or call{" "}
							<Link href="tel:1800-5711333">1800-5711333</Link>.
						</p>
					</div>
					<div className="col-lg-7">
						<div className="contact-form wow fadeInUp" data-wow-delay=".1s">
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
