import { TOUR_TARGETS } from "./tourTargets";

/**
 * News Submission Form Guided Tour
 * 
 * Guides users through the news submission process
 */
export const newsSubmissionTour = [
  {
    target: TOUR_TARGETS.SUBMIT_NEWS.FORM_CONTAINER,
    content: "Submit news for verification. Fill out all required fields to help our community assess its credibility.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: TOUR_TARGETS.SUBMIT_NEWS.TITLE_INPUT,
    content: "Enter a clear, concise title for the news article.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.SUBMIT_NEWS.DESCRIPTION_INPUT,
    content: "Provide a detailed description. Include context, sources, and why this needs verification.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.SUBMIT_NEWS.LINK_INPUT,
    content: "Add the source URL where you found this news. This helps with fact-checking.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.SUBMIT_NEWS.IMAGE_TYPE_TOGGLE,
    content: "Choose to upload images or provide image URLs as evidence.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.SUBMIT_NEWS.IMAGE_UPLOAD,
    content: "Upload screenshots or images that support the news article.",
    placement: "top",
  },
  {
    target: TOUR_TARGETS.SUBMIT_NEWS.SUBMIT_BTN,
    content: "Once all fields are filled, submit your news for community verification.",
    placement: "top",
  },
];
