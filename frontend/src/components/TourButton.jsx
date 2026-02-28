import { useState, useEffect, useRef } from "react";
import { useTour } from "./TourProvider";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

/**
 * Tour Button Component
 * 
 * Dropdown with two tour options:
 * 1. Discover Features — Modal slideshow of all platform features
 * 2. Explore Platform — Joyride walkthrough of current page UI
 */
const TourButton = () => {
  const {
    startFeaturesTour,
    startPlatformTour,
    startJourneyTour,
    startRealExperience,
    startPitchMode,
    isPlatformTourAvailable,
    isPlatformTourRunning,
    isFeaturesTourOpen,
    isJourneyTourOpen,
    isRealExperienceOpen,
    isPitchModeOpen,
  } = useTour();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [showDropdown]);

  // Hide entirely while a tour is actively running
  if (isPlatformTourRunning || isFeaturesTourOpen || isJourneyTourOpen || isRealExperienceOpen || isPitchModeOpen) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-all duration-200 text-blue-600 dark:text-blue-400 hover:text-sky-400"
        title="Start a Tour"
        aria-label="Start a Tour"
      >
        <QuestionMarkCircleIcon className="w-5 h-5" />
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-11 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Guided Tours
            </p>
          </div>

          {/* Discover Features */}
          <button
            onClick={() => {
              setShowDropdown(false);
              startFeaturesTour();
            }}
            className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Discover Features
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  See all platform capabilities
                </p>
              </div>
            </div>
          </button>

          {/* Explore Platform */}
          {isPlatformTourAvailable && (
            <button
              onClick={() => {
                setShowDropdown(false);
                startPlatformTour();
              }}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Explore Platform
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Walk through this page's UI
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Journey Tour */}
          <button
            onClick={() => {
              setShowDropdown(false);
              startJourneyTour();
            }}
            className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group border-t border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Experience Journey
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Interactive demo simulation
                </p>
              </div>
            </div>
          </button>

          {/* ── Live & Present Section ── */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Live & Present
            </p>
          </div>

          {/* Real Experience */}
          <button
            onClick={() => {
              setShowDropdown(false);
              startRealExperience();
            }}
            className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Live Experience
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Real actions on actual page
                </p>
              </div>
            </div>
          </button>

          {/* Pitch Showcase */}
          <button
            onClick={() => {
              setShowDropdown(false);
              startPitchMode();
            }}
            className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group border-t border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Pitch Showcase
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Cinematic project presentation
                </p>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default TourButton;
