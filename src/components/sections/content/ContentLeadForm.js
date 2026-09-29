"use client";
import ContactFormBody from "@/components/sections/contacts/ContactFormBody";
import useContactForm from "@/hooks/useContactForm";
import { leadForm } from "@/libs/leadForms";

const ContentLeadForm = ({ type, contentId, title, intro }) => {
	const form = useContactForm(type, { contentId });
	return (
		<div className="contact-form lead-form-card content-lead-form">
			<h3 className="title">{title}</h3>
			{intro ? <p>{intro}</p> : null}
			<form onSubmit={form.handleSubmit} noValidate>
				<ContactFormBody form={form} submitText={leadForm(type).submitText} />
			</form>
		</div>
	);
};

export default ContentLeadForm;
