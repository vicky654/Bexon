"use client";

import { useState } from "react";
import useSweetAlert from "@/hooks/useSweetAlert";

const initialFormData = {
	name: "",
	email: "",
	phone: "",
	service: "",
	message: "",
};

const useContactForm = () => {
	const creteAlert = useSweetAlert();
	const [formData, setFormData] = useState(initialFormData);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleChange = e => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleServiceChange = option => {
		setFormData(prev => ({ ...prev, service: option?.optionName || "" }));
	};

	const handleSubmit = async e => {
		e.preventDefault();

		if (!formData.name || !formData.email || !formData.message) {
			creteAlert("error", "Please fill in your name, email and message.");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});
			const data = await res.json();

			if (!res.ok) {
				creteAlert("error", data?.message || "Something went wrong.");
				return;
			}

			creteAlert("success", "Your message has been sent successfully.");
			setFormData(initialFormData);
		} catch (error) {
			creteAlert("error", "Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return {
		formData,
		isSubmitting,
		handleChange,
		handleServiceChange,
		handleSubmit,
	};
};

export default useContactForm;
