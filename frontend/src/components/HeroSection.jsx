// src/components/HeroSection.jsx

import React, { useEffect, useState } from 'react';
import { FaSearch, FaUsers } from 'react-icons/fa';
import { useTheme } from './NavBar';
import { useNavigate } from 'react-router-dom';

export default function HeroSection({ scrollToHow, scrollToTeam }) {
  const { isDarkMode } = useTheme();
  const taglines = [
    'Because the Truth Deserves a Second Opinion.',
    'Verified by the People, Backed by Experts.',
    'Debate It. Discuss It. Decide It.'
  ];
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();


  // Add CSS animation styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&display=swap');
      
      @keyframes slideUpOut {
        0% {
          opacity: 1;
          transform: translateY(0);
        }
        100% {
          opacity: 0;
          transform: translateY(-60px);
        }
      }
      
      @keyframes slideUpIn {
        0% {
          opacity: 0;
          transform: translateY(60px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes heroScrollBounce {
        0%, 100% { transform: translateY(0); opacity: 0.6; }
        50% { transform: translateY(10px); opacity: 1; }
      }
      @keyframes heroFadeUp {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      .hero-scroll-indicator {
        animation: heroFadeUp 1s ease-out 1.5s both, heroScrollBounce 2s ease-in-out 2.5s infinite;
      }
      .hero-name-glow {
        text-shadow: 0 0 40px rgba(56,189,248,0.35), 0 0 80px rgba(52,211,153,0.2);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      // Start slide up out
      setIsVisible(false);
      
      // After slide out completes, change tagline and slide in from bottom
      setTimeout(() => {
        setTaglineIndex((prev) => (prev + 1) % taglines.length);
        setIsVisible(true);
      }, 800); // Wait for slide out to complete
    }, 5000); // 5 seconds total cycle
    
    return () => clearInterval(interval);
  }, []);

  // Helper to highlight key words in taglines with gradient
  function renderTagline(text) {
    // Highlight different key words based on the tagline
    if (text.includes('Truth')) {
      const parts = text.split(/(\bTruth\b|\bSecond\b|\bOpinion\b)/);
      return (
        <>
          {parts.map((part, index) => {
            if (part === 'Truth' || part === 'Second' || part === 'Opinion') {
              return (
                <span
                  key={index}
                  className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent hover:from-sky-600 hover:to-emerald-600 glow-effect-text"
                >
                  {part}
                </span>
              );
            }
            return part;
          })}
        </>
      );
    } else if (text.includes('People')) {
      const parts = text.split(/(\bPeople\b|\bExperts\b)/);
      return (
        <>
          {parts.map((part, index) => {
            if (part === 'People' || part === 'Experts') {
              return (
                <span
                  key={index}
                  className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent hover:from-sky-600 hover:to-emerald-600 glow-effect-text"
                >
                  {part}
                </span>
              );
            }
            return part;
          })}
        </>
      );
    } else if (text.includes('Debate')) {
      const parts = text.split(/(\bDebate\b|\bDiscuss\b|\bDecide\b)/);
      return (
        <>
          {parts.map((part, index) => {
            if (part === 'Debate' || part === 'Discuss' || part === 'Decide') {
              return (
                <span
                  key={index}
                  className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent hover:from-sky-600 hover:to-emerald-600 glow-effect-text"
                >
                  {part}
                </span>
              );
            }
            return part;
          })}
        </>
      );
    }
    return text;
  }

  return (
    <section
      data-tour="landing-hero"
      className={`py-4 relative overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-[#0D1117] text-[#C9D1D9]' : 'bg-gray-50 text-gray-900'
      }`}
    >
    
      {/* Taglines */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-4 min-h-[180px] md:min-h-[210px] xl:min-h-[230px] flex items-center justify-center overflow-hidden" data-scroll>
          <h1 
            className={`text-4xl md:text-6xl xl:text-7xl font-extrabold leading-tight tracking-tight glow-effect ${
              isDarkMode ? 'text-[#C9D1D9]' : 'text-gray-900'
            }`}
            key={taglineIndex}
            style={{
              animation: isVisible ? 'slideUpIn 0.8s ease-out' : 'slideUpOut 1.2s ease-in',
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: '0.9'
            }}
          >
            {renderTagline(taglines[taglineIndex])}
          </h1>
        </div>
        {/* small description */}
        <div className='flex justify-center mb-4 px-4' data-scroll data-scroll-speed="2">
          <p className={`text-sm md:text-base max-w-3xl text-center font-medium leading-relaxed transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`} 
          style={{
            fontFamily: "'Inter', 'system-ui', sans-serif",
            fontWeight: 600,
            letterSpacing: '0.01em'
          }}>
            From public reports to expert verification, from clustered insights to live debates — everything you need to cut through misinformation.
          </p>
        </div>

        {/* Developer attribution */}
        <div className="flex justify-center mb-5" data-scroll data-scroll-speed="2">
          <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-full border shadow-sm backdrop-blur-sm ${
            isDarkMode
              ? 'bg-[#161B22]/80 border-sky-800/50 text-gray-400'
              : 'bg-white/80 border-sky-200 text-gray-500'
          }`} style={{ fontFamily: "'Inter', sans-serif" }}>
            <span className="text-sm font-medium">Developed by&nbsp;
              <span className="text-lg font-bold bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent hero-name-glow">
                Deepanshu Gupta
              </span>
            </span>
            <span className={`h-4 w-px ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
            <a
              href="https://ieeexplore.ieee.org/document/11565047"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-sky-500 hover:text-sky-400 transition-colors font-semibold"
            >
              🏆 IEEE Published
            </a>
          </div>
        </div>

        <div className="flex justify-center space-x-6 mb-6" data-scroll data-scroll-speed="3">
          <button
            onClick={scrollToHow}
            className="bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white font-bold px-6 py-3 rounded-lg transition-colors duration-300"
          >
            How It Works
          </button>
          <button
            data-tour="landing-get-started"
            className={`px-6 py-3 rounded-lg transition-colors duration-300 font-bold border-4 flex items-center gap-2 ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-800 text-[#C9D1D9] border-gray-600'
                : 'bg-white hover:bg-gray-100 text-sky-600 border-sky-400 '
            }`}
            onClick={scrollToTeam}>
            About the Developer
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        {/* Scroll Down Indicator */}
        <div className="flex flex-col items-center gap-1 pb-2">
          <div className="relative flex items-center justify-center hero-scroll-indicator text-sky-500">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

      </div>
    </section>
  );
}



