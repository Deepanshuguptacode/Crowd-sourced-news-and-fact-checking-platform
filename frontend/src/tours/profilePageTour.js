import { TOUR_TARGETS } from "./tourTargets";

/**
 * Profile Page Guided Tour
 * 
 * Helps users customize and manage their profile
 */
export const profilePageTour = [
  {
    target: TOUR_TARGETS.PROFILE.PROFILE_CONTAINER,
    content: "Welcome to your profile! Manage your information and view your activity.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: TOUR_TARGETS.PROFILE.PHOTO_UPLOAD,
    content: "Upload a profile photo to personalize your account.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.PROFILE.EDIT_BTN,
    content: "Click here to edit your profile information.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.PROFILE.NAME_INPUT,
    content: "Update your full name and personal information.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.PROFILE.BIO_INPUT,
    content: "Add a bio to tell the community about yourself and your expertise.",
    placement: "bottom",
  },
  {
    target: TOUR_TARGETS.PROFILE.CHANGE_PASSWORD_BTN,
    content: "Keep your account secure by changing your password regularly.",
    placement: "left",
  },
  {
    target: TOUR_TARGETS.PROFILE.SAVE_BTN,
    content: "Don't forget to save your changes!",
    placement: "top",
  },
];
