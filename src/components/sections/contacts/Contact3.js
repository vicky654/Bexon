"use client";
import ContactFormBody from "@/components/sections/contacts/ContactFormBody";
import useContactForm from "@/hooks/useContactForm";

const Contact3 = () => {
	const form = useContactForm();

	return (
		<section className="tj-contact-section-2 section-bottom-gap">
			<div className="container">
				<div className="row">
					<div className="col-lg-6">
						<div className="contact-form wow fadeInUp" data-wow-delay=".1s">
							<h3 className="title">
								Feel Free to Get in Touch or Visit our Location.
							</h3>
							<form id="contact-form" onSubmit={form.handleSubmit} noValidate>
								<ContactFormBody form={form} submitText={"Submit Now"} />
							</form>
						</div>
					</div>
					<div className="col-lg-6">
						<div className="map-area wow fadeInUp" data-wow-delay=".3s">
							<iframe src="https://www.google.com/maps?q=4th+floor%2C+GM+IT+Park%2C+Plot+no+32-33%2C+Sector+142%2C+Noida%2C+Uttar+Pradesh+201304&output=embed"></iframe>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Contact3;
