"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminHome() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/blogs");
	}, [router]);

	return null;
}
