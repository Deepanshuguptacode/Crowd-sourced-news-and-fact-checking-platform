import { TOUR_TARGETS } from "./tourTargets";

/**
 * Debate Rooms List — Platform Tour
 * 
 * Guides users through browsing and creating debate rooms
 */
export const debateRoomsTour = [
  {
    target: TOUR_TARGETS.DEBATE_ROOMS.CREATE_ROOM_BTN,
    content: "Create a new debate room on any topic. Set a title, description, and tags — then invite the community to argue FOR and AGAINST.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: TOUR_TARGETS.DEBATE_ROOMS.SEARCH_INPUT,
    content: "Search for debate rooms by topic, title, or keywords. Find active discussions that interest you.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.DEBATE_ROOMS.ROOM_LIST,
    content: "Browse all active debate rooms. Each card shows the topic, participant count, comment activity, and tags.",
    placement: "top",
  },
  {
    target: TOUR_TARGETS.DEBATE_ROOMS.ROOM_CARD,
    content: "Click 'Join Debate' to participate, or 'View Room' to observe. Inside, AI organizes arguments into FOR vs AGAINST groups and auto-pairs counter-arguments!",
    placement: "bottom",
  },
];
