import { TOUR_TARGETS } from "./tourTargets";

/**
 * Landing Page Guided Tour
 * 
 * Introduces new visitors to the platform's main features
 */
export const landingPageTour = [
  {
    target: TOUR_TARGETS.LANDING.HERO_SECTION,
    content: "Welcome to VoxVeritas! This is your gateway to crowd-sourced news verification and fact-checking.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: TOUR_TARGETS.LANDING.GET_STARTED_BTN,
    content: "Click here to get started and join our community of fact-checkers.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: TOUR_TARGETS.LANDING.ABOUT_SECTION,
    content: "Learn about our mission to combat misinformation through community-driven verification.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: TOUR_TARGETS.LANDING.FEATURES_SECTION,
    content: "Explore our key features: AI-powered verification, expert voting, and community engagement.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: TOUR_TARGETS.LANDING.HOW_IT_WORKS,
    content: "Discover how our platform works to combat misinformation through a multi-layered verification process.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: TOUR_TARGETS.LANDING.TEAM_SECTION,
    content: "Meet the team behind VoxVeritas.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: TOUR_TARGETS.LANDING.LOGIN_BTN,
    content: "Already have an account? Click here to log in.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: TOUR_TARGETS.LANDING.SIGNUP_BTN,
    content: "New here? Sign up to start verifying news and earning credibility points.",
    placement: "top",
    disableBeacon: true,
  },
];
