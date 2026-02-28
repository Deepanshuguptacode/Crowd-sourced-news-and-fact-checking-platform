import { TOUR_TARGETS } from "./tourTargets";

/**
 * Home Page Platform Tour
 * 
 * Walks through the news feed page UI elements.
 * Steps targeting conditional elements (AI analysis, comment section)
 * auto-skip if elements aren't visible.
 */
export const homePageTour = [
  {
    target: TOUR_TARGETS.HOME.HEADER,
    content: "Welcome to VoxVeritas! This is your navigation hub — access Home, Trending News, Experts, and Submit News from here. Toggle dark mode, search articles, or start tours anytime.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: TOUR_TARGETS.HOME.FIRST_NEWS_CARD,
    content: "Each news card shows the article title, verification status, and source. Every article goes through 3-tier verification: Community Voting → Expert Analysis → AI Verdict. Click any card to expand comments, vote, and see AI analysis.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.HOME.VOTING_BUTTONS,
    content: "Vote on article authenticity! Upvote (green) if you believe it's real, downvote (red) if it seems fake. Community votes aggregate to determine the article's verification status — your vote matters!",
    placement: "top",
  },
  {
    target: TOUR_TARGETS.HOME.AI_ANALYSIS_BTN,
    content: "AI Analysis — our machine learning model (powered by Google Gemini) scans each article and returns a verdict: Likely Real or Potential Misinformation, with a confidence percentage. Click to expand the detailed analysis.",
    placement: "top",
  },
  {
    target: TOUR_TARGETS.HOME.AI_VERDICT,
    content: "AI Verdict Section — request or view the comprehensive AI fact-check verdict for this article. The AI analyzes content patterns, source credibility, and cross-references facts to generate a detailed verdict.",
    placement: "top",
  },
  {
    target: TOUR_TARGETS.HOME.COMMENTS_BTN,
    content: "Click here to open the comment section. Inside you'll find:\n\n• Stance selection (In Favor / Against / General)\n• 'Group by Topic' — AI clusters similar comments\n• 'Improve Groups' — AI refines group descriptions\n• Evidence links support for each comment\n• Expert voting on individual comments",
    placement: "top",
  },
  {
    target: TOUR_TARGETS.HOME.QUICK_ACTIONS,
    content: "Your quick actions panel — navigate to Trending News, Debate Rooms, Expert Panel, and more. This sidebar keeps all important actions one click away.",
    placement: "left",
  },
  {
    target: TOUR_TARGETS.HOME.SUBMIT_NEWS_BTN,
    content: "Found news that needs verification? Click here to submit it. Add a title, description, source link, and evidence images. The community will then vote and experts will analyze it.",
    placement: "bottom",
  },
];
