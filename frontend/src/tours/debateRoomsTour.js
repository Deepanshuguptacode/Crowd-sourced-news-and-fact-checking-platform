import { TOUR_TARGETS } from "./tourTargets";

/**
 * Debate Rooms Guided Tour
 * 
 * Guides users through creating and joining debate rooms
 */
export const debateRoomsTour = [
  {
    target: TOUR_TARGETS.DEBATE_ROOMS.PAGE_CONTAINER,
    content: "Debate rooms allow structured discussions on controversial topics and news items.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: TOUR_TARGETS.DEBATE_ROOMS.CREATE_ROOM_BTN,
    content: "Create a new debate room to discuss a specific topic with the community.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.DEBATE_ROOMS.SEARCH_INPUT,
    content: "Search for debate rooms by topic, title, or keywords.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.DEBATE_ROOMS.ROOM_LIST,
    content: "Browse active debate rooms and see participant counts and activity levels.",
    placement: "top",
  },
  {
    target: TOUR_TARGETS.DEBATE_ROOMS.ROOM_CARD,
    content: "Each room shows the topic, number of participants, and recent activity.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.DEBATE_ROOMS.JOIN_BTN,
    content: "Join a debate room to participate in the discussion and share your perspective.",
    placement: "left",
  },
];
