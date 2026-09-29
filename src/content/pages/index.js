import dpdpAct from "./dpdp-act.js";
import dpdpActBusinessContinuity from "./dpdp-act-business-continuity.js";
import dpdpActDpdpRules2025 from "./dpdp-act-dpdp-rules-2025.js";
import dpdpActPenaltiesAndFines from "./dpdp-act-penalties-and-fines.js";
import dpdpActThirdPartyObligations from "./dpdp-act-third-party-obligations.js";

export const PAGES = [dpdpAct, dpdpActDpdpRules2025, dpdpActPenaltiesAndFines, dpdpActThirdPartyObligations, dpdpActBusinessContinuity];

const BY_PATH = new Map(PAGES.map(page => [page.path, page]));

export function getPage(path) {
	return BY_PATH.get(path) || null;
}

export function childPages(prefix) {
	return PAGES.filter(page => page.path.startsWith(`${prefix}/`));
}
