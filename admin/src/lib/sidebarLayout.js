"use client";

import { createContext, useContext } from "react";

export const SIDEBAR_LAYOUT_STORAGE_KEY = "adminSidebarLayout";

export const SIDEBAR_LAYOUTS = [
	{
		value: "overlay",
		label: "Overlay",
		description: "Hidden by default, slides over full-width content with a backdrop.",
	},
	{
		value: "docked",
		label: "Static vertical",
		description: "Always visible on the left, pushes content over.",
	},
	{
		value: "mini",
		label: "Collapsible mini rail",
		description: "Docked icon rail that expands to full labels on click.",
	},
	{
		value: "horizontal",
		label: "Horizontal top nav",
		description: "No sidebar — nav links live in the top bar.",
	},
];

export const SidebarLayoutContext = createContext({
	layout: "overlay",
	setLayout: () => {},
});

export function useSidebarLayout() {
	return useContext(SidebarLayoutContext);
}
