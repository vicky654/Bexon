import dpdpAct from "./dpdp-act.js";
import dpdpActBusinessContinuity from "./dpdp-act-business-continuity.js";
import dpdpActDpdpRules2025 from "./dpdp-act-dpdp-rules-2025.js";
import dpdpActPenaltiesAndFines from "./dpdp-act-penalties-and-fines.js";
import dpdpActThirdPartyObligations from "./dpdp-act-third-party-obligations.js";
import products from "./products.js";
import productsAwarenessProgram from "./products-awareness-program.js";
import productsConsentManagement from "./products-consent-management.js";
import productsCookieConsent from "./products-cookie-consent.js";
import productsGrievanceRedressal from "./products-grievance-redressal.js";
import productsImpactAssessment from "./products-impact-assessment.js";
import productsThirdPartyAssessment from "./products-third-party-assessment.js";

export const PAGES = [
	dpdpAct,
	dpdpActDpdpRules2025,
	dpdpActPenaltiesAndFines,
	dpdpActThirdPartyObligations,
	dpdpActBusinessContinuity,
	products,
	productsConsentManagement,
	productsGrievanceRedressal,
	productsAwarenessProgram,
	productsImpactAssessment,
	productsThirdPartyAssessment,
	productsCookieConsent,
];

const BY_PATH = new Map(PAGES.map(page => [page.path, page]));

export function getPage(path) {
	return BY_PATH.get(path) || null;
}

export function childPages(prefix) {
	return PAGES.filter(page => page.path.startsWith(`${prefix}/`));
}
