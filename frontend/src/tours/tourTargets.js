/**
 * Centralized Tour Target Selectors
 * 
 * All tourable UI elements use data-tour attributes.
 * This ensures maintainability and clean selectors.
 */

export const TOUR_TARGETS = {
  // Landing Page
  LANDING: {
    HERO_SECTION: '[data-tour="landing-hero"]',
    GET_STARTED_BTN: '[data-tour="landing-get-started"]',
    FEATURES_SECTION: '[data-tour="landing-features"]',
    ABOUT_SECTION: '[data-tour="landing-about"]',
    HOW_IT_WORKS: '[data-tour="landing-how-it-works"]',
    TEAM_SECTION: '[data-tour="landing-team"]',
    LOGIN_BTN: '[data-tour="landing-login"]',
    SIGNUP_BTN: '[data-tour="landing-signup"]',
  },

  // Home Page (News Feed)
  HOME: {
    NEWS_FEED: '[data-tour="home-news-feed"]',
    QUICK_ACTIONS: '[data-tour="home-quick-actions"]',
    SUBMIT_NEWS_BTN: '[data-tour="home-submit-news"]',
    MENU_TOGGLE: '[data-tour="home-menu-toggle"]',
    HEADER: '[data-tour="home-header"]',
    FIRST_NEWS_CARD: '[data-tour="home-first-news-card"]',
    COMMENT_SECTION: '[data-tour="home-comment-section"]',
    GROUP_BY_TOPIC_BTN: '[data-tour="home-group-comments"]',
    IMPROVE_GROUPS_BTN: '[data-tour="home-improve-groups"]',
    STANCE_SELECTOR: '[data-tour="home-stance-selector"]',
    COMMENT_INPUT: '[data-tour="home-comment-input"]',
    COMMENT_CARD: '[data-tour="home-comment-card"]',
    VOTING_BUTTONS: '[data-tour="home-voting-buttons"]',
    AI_ANALYSIS_BTN: '[data-tour="home-ai-analysis"]',
    AI_VERDICT: '[data-tour="home-ai-verdict"]',
    COMMENTS_BTN: '[data-tour="home-comments-btn"]',
  },

  // News Submission Form
  SUBMIT_NEWS: {
    FORM_CONTAINER: '[data-tour="submit-form-container"]',
    TITLE_INPUT: '[data-tour="submit-title"]',
    DESCRIPTION_INPUT: '[data-tour="submit-description"]',
    LINK_INPUT: '[data-tour="submit-link"]',
    IMAGE_UPLOAD: '[data-tour="submit-image-upload"]',
    IMAGE_URL_INPUT: '[data-tour="submit-image-url"]',
    SUBMIT_BTN: '[data-tour="submit-button"]',
    IMAGE_TYPE_TOGGLE: '[data-tour="submit-image-toggle"]',
  },

  // Profile Page
  PROFILE: {
    PROFILE_CONTAINER: '[data-tour="profile-container"]',
    EDIT_BTN: '[data-tour="profile-edit-btn"]',
    PHOTO_UPLOAD: '[data-tour="profile-photo"]',
    NAME_INPUT: '[data-tour="profile-name"]',
    BIO_INPUT: '[data-tour="profile-bio"]',
    SAVE_BTN: '[data-tour="profile-save-btn"]',
    CHANGE_PASSWORD_BTN: '[data-tour="profile-password-btn"]',
    STATS_SECTION: '[data-tour="profile-stats"]',
  },

  // Experts Page
  EXPERTS: {
    PAGE_CONTAINER: '[data-tour="experts-container"]',
    SEARCH_INPUT: '[data-tour="experts-search"]',
    FILTER_SELECT: '[data-tour="experts-filter"]',
    EXPERT_CARD: '[data-tour="experts-card"]',
    VERIFIED_BADGE: '[data-tour="experts-verified"]',
  },

  // Debate Rooms List
  DEBATE_ROOMS: {
    PAGE_CONTAINER: '[data-tour="debate-rooms-container"]',
    CREATE_ROOM_BTN: '[data-tour="debate-create-btn"]',
    SEARCH_INPUT: '[data-tour="debate-search"]',
    ROOM_CARD: '[data-tour="debate-room-card"]',
    JOIN_BTN: '[data-tour="debate-join-btn"]',
    ROOM_LIST: '[data-tour="debate-room-list"]',
  },

  // Individual Debate Room
  DEBATE_ROOM: {
    CONTAINER: '[data-tour="debate-room-container"]',
    HEADER: '[data-tour="debate-room-header"]',
    VIEW_TOGGLE: '[data-tour="debate-room-view-toggle"]',
    COMMENT_INPUT: '[data-tour="debate-room-comment-input"]',
    GROUPS: '[data-tour="debate-room-groups"]',
    GROUP_CARD: '[data-tour="debate-room-group-card"]',
    COUNTER_LINKS: '[data-tour="debate-room-counter-links"]',
    IDEAL_COUNTERS: '[data-tour="debate-room-ideal-counters"]',
    COUNTER_VIEW: '[data-tour="debate-room-counter-view"]',
    UNGROUPED: '[data-tour="debate-room-ungrouped"]',
  },

  // Trending Page
  TRENDING: {
    PAGE_CONTAINER: '[data-tour="trending-container"]',
    TRENDING_NEWS: '[data-tour="trending-news"]',
    FILTER_TABS: '[data-tour="trending-filters"]',
  },
};
