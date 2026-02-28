import { useState, useEffect, createContext, useContext } from "react";
import Joyride, { ACTIONS, EVENTS, STATUS } from "react-joyride";
import { useLocation } from "react-router-dom";
import { landingPageTour } from "../tours/landingPageTour";
import { homePageTour } from "../tours/homePageTour";
import { newsSubmissionTour } from "../tours/newsSubmissionTour";
import { profilePageTour } from "../tours/profilePageTour";
import { expertsPageTour } from "../tours/expertsPageTour";
import { debateRoomsTour } from "../tours/debateRoomsTour";

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
 * Responsibilities:
 * - Detect current route
 * - Load correct tour steps
 * - Provide manual tour control
 * - Persist completion in localStorage
 * - Handle tour state and callbacks
 */

const TourProvider = ({ children }) => {
  const location = useLocation();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  /**
   * Get tour steps based on current route
   */
  const getSteps = () => {
    const path = location.pathname;
    
    // Direct route matches
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
      default:
        // Pattern matches for dynamic routes
        if (path.startsWith("/debate-room/")) {
          return debateRoomsTour;
        }
        return [];
    }
  };

  const steps = getSteps();

  /**
   * Check if tour has been completed for this page
   */
  const getTourKey = () => {
    const routeKey = location.pathname.replace(/\//g, "_") || "root";
    return `tour_completed_${routeKey}`;
  };

  const isTourCompleted = () => {
    const tourKey = getTourKey();
    return localStorage.getItem(tourKey) === "true";
  };

  const markTourCompleted = () => {
    const tourKey = getTourKey();
    localStorage.setItem(tourKey, "true");
  };

  const markTourIncomplete = () => {
    const tourKey = getTourKey();
    localStorage.removeItem(tourKey);
  };

  /**
   * Manual tour control functions
   */
  const startTour = () => {
    if (steps.length > 0) {
      setStepIndex(0);
      setRun(true);
    }
  };

  const stopTour = () => {
    setRun(false);
  };

  const resetTour = () => {
    markTourIncomplete();
    startTour();
  };

  /**
   * Reset tour state when route changes (no auto-start)
   */
  useEffect(() => {
    setStepIndex(0);
    setRun(false);
  }, [location.pathname]);

  /**
   * Handle tour callback events
   */
  const handleJoyrideCallback = (data) => {
    const { action, index, status, type, step } = data;

    // Scroll to target when moving between steps
    if (type === EVENTS.STEP_BEFORE) {
      const element = document.querySelector(step.target);
      if (element) {
        // Give a moment for the previous tooltip to close
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
      // Update step index
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
      
      // If target not found, try to scroll to it manually
      if (type === EVENTS.TARGET_NOT_FOUND && step?.target) {
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
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Tour finished or skipped
      setRun(false);
      markTourCompleted();
    }
  };

  // Provide tour control context
  const tourContextValue = {
    startTour,
    stopTour,
    resetTour,
    isTourAvailable: steps.length > 0,
    isTourCompleted: isTourCompleted(),
    isRunning: run,
  };

  return (
    <TourContext.Provider value={tourContextValue}>
      {children}
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
          spotlightPadding={10}
          callback={handleJoyrideCallback}
          styles={{
            options: {
              zIndex: 10000,
              primaryColor: "#3b82f6",
              textColor: "#1f2937",
              backgroundColor: "#ffffff",
              overlayColor: "rgba(0, 0, 0, 0.5)",
              arrowColor: "#ffffff",
              width: 380,
            },
            tooltip: {
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            },
            tooltipContainer: {
              textAlign: "left",
            },
            tooltipContent: {
              padding: "10px 0",
              fontSize: "15px",
              lineHeight: "1.6",
            },
            buttonNext: {
              backgroundColor: "#3b82f6",
              borderRadius: 8,
              fontSize: 14,
              padding: "10px 20px",
            },
            buttonBack: {
              color: "#6b7280",
              marginRight: 10,
              fontSize: 14,
            },
            buttonSkip: {
              color: "#6b7280",
              fontSize: 14,
            },
            buttonClose: {
              display: "none",
            },
            spotlight: {
              borderRadius: 8,
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
            back: "Back",
            close: "Close",
            last: "Finish",
            next: "Next",
            skip: "Skip Tour",
          }}
        />
      )}
    </TourContext.Provider>
  );
};

export default TourProvider;
