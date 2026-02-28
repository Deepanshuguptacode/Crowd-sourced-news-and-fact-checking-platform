import { TOUR_TARGETS } from "./tourTargets";

/**
 * Experts Page Guided Tour
 * 
 * Introduces users to the expert community
 */
export const expertsPageTour = [
  {
    target: TOUR_TARGETS.EXPERTS.PAGE_CONTAINER,
    content: "Browse verified experts in various fields who help fact-check news on our platform.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: TOUR_TARGETS.EXPERTS.SEARCH_INPUT,
    content: "Search for experts by name, profession, or area of expertise.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.EXPERTS.FILTER_SELECT,
    content: "Filter experts by their profession to find specialists in specific domains.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.EXPERTS.EXPERT_CARD,
    content: "View expert profiles including their credentials, profession, and verification status.",
    placement: "top",
  },
  {
    target: TOUR_TARGETS.EXPERTS.VERIFIED_BADGE,
    content: "The 'Verified Expert' badge indicates that this user has been authenticated and approved.",
    placement: "bottom",
  },
];
