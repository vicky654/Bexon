"use client";

import { useEffect } from "react";
import { captureTracking } from "@/libs/tracking";

const TrackingCapture = () => {
	useEffect(() => {
		captureTracking();
	}, []);
	return null;
};

export default TrackingCapture;
