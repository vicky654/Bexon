import dpdpActPenaltiesAndFines from "./dpdp-act-penalties-and-fines.js";

export const PAGES = [dpdpActPenaltiesAndFines];

const BY_PATH = new Map(PAGES.map(page => [page.path, page]));

export function getPage(path) {
	return BY_PATH.get(path) || null;
}

export function childPages(prefix) {
	return PAGES.filter(page => page.path.startsWith(`${prefix}/`));
}
