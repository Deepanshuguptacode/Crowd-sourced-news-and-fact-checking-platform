import { TOUR_TARGETS } from "./tourTargets";

/**
 * Home Page Guided Tour
 * 
 * Helps users navigate the main news feed and dashboard
 */
export const homePageTour = [
  {
    target: TOUR_TARGETS.HOME.HEADER,
    content: "Welcome to your dashboard! Access all features from the navigation bar.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: TOUR_TARGETS.HOME.NEWS_FEED,
    content: "This is your news feed. Browse through submitted news articles and see their verification status.",
    placement: "top",
  },
  {
    target: TOUR_TARGETS.HOME.FIRST_NEWS_CARD,
    content: "Each news card shows the title, verdict, votes, and comments. Click to see details and participate.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.HOME.COMMENT_SECTION,
    content: "This is the comments section. View community and expert opinions on the news article.",
    placement: "top",
  },
  {
    target: TOUR_TARGETS.HOME.GROUP_BY_TOPIC_BTN,
    content: "Use AI to group similar comments by topic! This helps you see common themes and perspectives.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.HOME.STANCE_SELECTOR,
    content: "Choose your stance before commenting: In Favor 👍, Against 👎, or General 💬. This helps organize discussions.",
    placement: "top",
  },
  {
    target: TOUR_TARGETS.HOME.COMMENT_INPUT,
    content: "Add your comment here. Community and expert users can contribute evidence and expert votes.",
    placement: "top",
  },
  {
    target: TOUR_TARGETS.HOME.QUICK_ACTIONS,
    content: "Quick actions panel: Submit news, view trending topics, and access expert opinions.",
    placement: "left",
  },
  {
    target: TOUR_TARGETS.HOME.SUBMIT_NEWS_BTN,
    content: "Found something newsworthy? Click here to submit it for verification.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.HOME.MENU_TOGGLE,
    content: "On mobile? Use this button to access the quick actions menu.",
    placement: "left",
  },
];
