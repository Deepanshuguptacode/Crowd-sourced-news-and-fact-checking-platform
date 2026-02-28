import { useState, useEffect, createContext, useContext } from "react";
import Joyride, { ACTIONS, EVENTS, STATUS } from "react-joyride";
import { useLocation } from "react-router-dom";
import { landingPageTour } from "../tours/landingPageTour";
import { homePageTour } from "../tours/homePageTour";
import { newsSubmissionTour } from "../tours/newsSubmissionTour";
import { profilePageTour } from "../tours/profilePageTour";
import { expertsPageTour } from "../tours/expertsPageTour";
import { debateRoomsTour } from "../tours/debateRoomsTour";
import { debateRoomTour } from "../tours/debateRoomTour";
import { trendingPageTour } from "../tours/trendingPageTour";
import FeaturesTour from "./FeaturesTour";
import JourneyTour from "./JourneyTour";

/**
 * Tour Context for manual control
 */
const TourContext = createContext();

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within TourProvider');
  }
  return context;
};

/**
 * Global Tour Provider Component
 * 
 * Supports two tour modes:
 * 1. Features Tour — Modal slideshow explaining all platform features
 * 2. Platform Tour — Joyride walkthrough of current page UI elements
 */

const TourProvider = ({ children }) => {
  const location = useLocation();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [showFeaturesTour, setShowFeaturesTour] = useState(false);
  const [showJourneyTour, setShowJourneyTour] = useState(false);

  /**
   * Get tour steps based on current route
   */
  const getSteps = () => {
    const path = location.pathname;
    
    switch (path) {
      case "/":
        return landingPageTour;
      case "/home":
        return homePageTour;
      case "/submit-news":
        return newsSubmissionTour;
      case "/profile":
        return profilePageTour;
      case "/experts":
        return expertsPageTour;
      case "/debate-rooms":
        return debateRoomsTour;
      case "/trending":
        return trendingPageTour;
      default:
        if (path.startsWith("/debate-room/")) {
          return debateRoomTour;
        }
        return [];
    }
  };

  const steps = getSteps();

  /**
   * Tour storage helpers
   */
  const getTourKey = () => {
    const routeKey = location.pathname.replace(/\//g, "_") || "root";
    return `tour_completed_${routeKey}`;
  };

  const isTourCompleted = () => {
    return localStorage.getItem(getTourKey()) === "true";
  };

  const markTourCompleted = () => {
    localStorage.setItem(getTourKey(), "true");
  };

  const markTourIncomplete = () => {
    localStorage.removeItem(getTourKey());
  };

  /**
   * Features Tour controls
   */
  const startFeaturesTour = () => {
    setRun(false); // stop platform tour if running
    setShowJourneyTour(false);
    setShowFeaturesTour(true);
  };

  const closeFeaturesTour = () => {
    setShowFeaturesTour(false);
  };

  /**
   * Journey Tour controls
   */
  const startJourneyTour = () => {
    setRun(false);
    setShowFeaturesTour(false);
    setShowJourneyTour(true);
  };

  const closeJourneyTour = () => {
    setShowJourneyTour(false);
  };

  /**
   * Platform Tour controls
   */
  const startPlatformTour = () => {
    if (steps.length > 0) {
      setShowFeaturesTour(false); // close features tour if open
      setShowJourneyTour(false); // close journey tour if open
      setStepIndex(0);
      // Small delay to let elements render after any state changes
      setTimeout(() => setRun(true), 300);
    }
  };

  const stopPlatformTour = () => {
    setRun(false);
  };

  const resetPlatformTour = () => {
    markTourIncomplete();
    startPlatformTour();
  };

  /**
   * Reset tour state when route changes
   */
  useEffect(() => {
    setStepIndex(0);
    setRun(false);
  }, [location.pathname]);

  /**
   * Handle Joyride callback events
   */
  const handleJoyrideCallback = (data) => {
    const { action, index, status, type, step } = data;

    // Scroll to target when moving between steps
    if (type === EVENTS.STEP_BEFORE) {
      const element = document.querySelector(step.target);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }, 100);
      }
    }

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      setStepIndex(nextIndex);
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      markTourCompleted();
    }
  };

  // Context value
  const tourContextValue = {
    // Features Tour
    startFeaturesTour,
    closeFeaturesTour,
    isFeaturesTourOpen: showFeaturesTour,
    // Journey Tour
    startJourneyTour,
    closeJourneyTour,
    isJourneyTourOpen: showJourneyTour,
    // Platform Tour
    startPlatformTour,
    stopPlatformTour,
    resetPlatformTour,
    isPlatformTourAvailable: steps.length > 0,
    isPlatformTourCompleted: isTourCompleted(),
    isPlatformTourRunning: run,
  };

  return (
    <TourContext.Provider value={tourContextValue}>
      {children}

      {/* Features Tour Modal */}
      <FeaturesTour isOpen={showFeaturesTour} onClose={closeFeaturesTour} />

      {/* Journey Tour Modal */}
      <JourneyTour isOpen={showJourneyTour} onClose={closeJourneyTour} />

      {/* Platform Tour (Joyride) */}
      {steps.length > 0 && (
        <Joyride
          steps={steps}
          run={run}
          stepIndex={stepIndex}
          continuous
          showSkipButton
          showProgress
          scrollToFirstStep={true}
          disableScrolling={false}
          scrollDuration={500}
          disableOverlayClose
          disableCloseOnEsc={false}
          scrollOffset={150}
          spotlightPadding={8}
          callback={handleJoyrideCallback}
          styles={{
            options: {
              zIndex: 10000,
              primaryColor: "#3b82f6",
              textColor: "#1f2937",
              backgroundColor: "#ffffff",
              overlayColor: "rgba(0, 0, 0, 0.5)",
              arrowColor: "#ffffff",
              width: 420,
            },
            tooltip: {
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            },
            tooltipContainer: {
              textAlign: "left",
            },
            tooltipContent: {
              padding: "10px 0",
              fontSize: "14px",
              lineHeight: "1.7",
            },
            buttonNext: {
              backgroundColor: "#3b82f6",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              padding: "10px 22px",
            },
            buttonBack: {
              color: "#6b7280",
              marginRight: 10,
              fontSize: 14,
            },
            buttonSkip: {
              color: "#9ca3af",
              fontSize: 13,
            },
            buttonClose: {
              display: "none",
            },
            spotlight: {
              borderRadius: 12,
            },
          }}
          floaterProps={{
            disableAnimation: false,
            styles: {
              arrow: {
                length: 8,
                spread: 16,
              },
            },
          }}
          locale={{
            back: "← Back",
            close: "Close",
            last: "Finish Tour ✓",
            next: "Next →",
            skip: "Skip Tour",
          }}
        />
      )}
    </TourContext.Provider>
  );
};

export default TourProvider;
