import { useTour } from "./TourProvider";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

/**
 * Tour Button Component
 * 
 * A navbar button that allows users to manually start/restart tours
 * Shows only when a tour is available for the current page
 */
const TourButton = () => {
  const { startTour, resetTour, isTourAvailable, isTourCompleted, isRunning } = useTour();

  // Don't show button if no tour available or tour is running
  if (!isTourAvailable || isRunning) return null;

  const handleClick = () => {
    if (isTourCompleted) {
      resetTour();
    } else {
      startTour();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-all duration-200 text-blue-600 dark:text-blue-400 hover:text-sky-400"
      title={isTourCompleted ? "Restart Tour" : "Start Tour"}
      aria-label={isTourCompleted ? "Restart Tour" : "Start Tour"}
    >
      <QuestionMarkCircleIcon className="w-5 h-5" />
    </button>
  );
};

export default TourButton;
