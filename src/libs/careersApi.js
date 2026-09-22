const localJobs = require("../../public/fakedata/careers.json");

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

async function getJobsFromBackend() {
	try {
		const res = await fetch(`${BACKEND_URL}/api/jobs`, { cache: "no-store" });
		if (!res.ok) throw new Error(`Backend responded with ${res.status}`);
		const data = await res.json();
		return data.jobs || [];
	} catch (error) {
		console.error("Falling back to local careers data:", error.message);
		return localJobs;
	}
}

async function getJobFromBackendById(id) {
	try {
		const res = await fetch(`${BACKEND_URL}/api/jobs/${id}`, { cache: "no-store" });
		if (res.status === 404) return null;
		if (!res.ok) throw new Error(`Backend responded with ${res.status}`);
		const data = await res.json();
		return data.job || null;
	} catch (error) {
		console.error("Falling back to local careers data:", error.message);
		return localJobs.find(item => item.id === Number(id)) || null;
	}
}

module.exports = { getJobsFromBackend, getJobFromBackendById };
