import { TOUR_TARGETS } from "./tourTargets";

/**
 * Individual Debate Room — Platform Tour
 * 
 * Guides users through participating in a debate room
 * with AI-powered counter-arguments, grouping, and structured layout.
 * 
 * Steps targeting conditional elements (counter-links, ideal-counters,
 * counter-view, ungrouped) will be auto-skipped by Joyride if elements
 * don't exist on the page at tour time.
 */
export const debateRoomTour = [
  {
    target: TOUR_TARGETS.DEBATE_ROOM.HEADER,
    content: "This is the debate room header — see the topic, participant count, and room info. Click the info icon to see the full description and tags.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: TOUR_TARGETS.DEBATE_ROOM.VIEW_TOGGLE,
    content: "Switch between two views:\n\n• Groups View — arguments organized by AI into clusters on each side\n• Counter Chat View — argument pairs matched by AI side-by-side\n\nClick 'Relink Groups' to let AI re-organize all arguments freshly.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.DEBATE_ROOM.COMMENT_INPUT,
    content: "Share your argument! First pick your stance — FOR or AGAINST — then type your argument. AI will automatically group it with similar viewpoints and find the best counter-argument.",
    placement: "top",
  },
  {
    target: TOUR_TARGETS.DEBATE_ROOM.GROUPS,
    content: "Arguments are organized in two columns:\n\n🟢 Supporting (left) — all arguments in favor\n🔴 Opposing (right) — all arguments against\n\nAI clusters similar arguments into groups and gives each group a title & description.",
    placement: "top",
  },
  {
    target: TOUR_TARGETS.DEBATE_ROOM.GROUP_CARD,
    content: "Each group card contains similar arguments clustered by AI. The card shows:\n\n• AI-generated title & description for the cluster\n• Number of comments in the group\n• Counter-link badges showing matched opposing groups\n• Expand to read all arguments, like/dislike, or delete your own",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.DEBATE_ROOM.COUNTER_LINKS,
    content: "Counter-link pairs! AI automatically matches each supporting group with the most relevant opposing group. The % badge shows match quality (higher = more directly opposing). Click to jump to the Counter Chat View for side-by-side comparison.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.DEBATE_ROOM.IDEAL_COUNTERS,
    content: "AI generates 'Ideal Counter-Arguments' — descriptions of what the perfect opposing argument would look like. This helps participants craft stronger rebuttals and keeps debates high-quality.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.DEBATE_ROOM.COUNTER_VIEW,
    content: "Counter Chat View shows argument pairs side-by-side — a supporting argument on the left matched with its best opposing argument on the right. Perfect for comparing perspectives!",
    placement: "top",
  },
  {
    target: TOUR_TARGETS.DEBATE_ROOM.UNGROUPED,
    content: "Off-topic & ungrouped comments land here. AI detects comments that don't fit the debate topic or couldn't be grouped, and separates them so the main discussion stays focused.",
    placement: "top",
  },
];
