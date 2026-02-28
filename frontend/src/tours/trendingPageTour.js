import { TOUR_TARGETS } from "./tourTargets";

/**
 * Trending News Page — Platform Tour
 * 
 * Guides users through discovering and reposting trending news
 */
export const trendingPageTour = [
  {
    target: TOUR_TARGETS.TRENDING.PAGE_CONTAINER,
    content: "Welcome to Trending News! Our AI engine scans trusted sources every 10 minutes to surface the most relevant stories. Click 'Refresh News' to fetch the latest manually.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: TOUR_TARGETS.TRENDING.FILTER_TABS,
    content: "Switch between 'Trending News' (AI-curated from external sources) and 'My Reposts' (stories you've shared to the community for verification).",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.TRENDING.TRENDING_NEWS,
    content: "Browse trending stories ranked by engagement and credibility. Found something newsworthy? Click 'Repost' to share it with the VoxVeritas community for multi-tier verification!",
    placement: "top",
  },
];
