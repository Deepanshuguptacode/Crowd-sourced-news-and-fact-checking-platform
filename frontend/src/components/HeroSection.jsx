// src/components/HeroSection.jsx

import React, { useEffect, useState } from 'react';
import { FaSearch, FaUsers } from 'react-icons/fa';
import { useTheme } from './NavBar';
import { useNavigate } from 'react-router-dom';

export default function HeroSection({ scrollToHow }) {
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
      const [before, after] = text.split('Truth');
      return (
        <>
          {before}
          <span className="bg-gradient-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent">
            Truth
          </span>
          {after}
        </>
      );
    } else if (text.includes('People')) {
      const [before, after] = text.split('People');
      return (
        <>
          {before}
          <span className="bg-gradient-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent">
            People
          </span>
          {after}
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
                  className="bg-gradient-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent"
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
      className={`py-8 relative overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
    
      {/* Taglines */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-8 min-h-[280px] md:min-h-[320px] xl:min-h-[340px] flex items-center justify-center overflow-hidden">
          <h1 
            className={`text-5xl md:text-7xl xl:text-8xl font-extrabold leading-tight tracking-tight ${
              isDarkMode ? 'text-white' : 'text-gray-900'
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
        <div className='flex justify-center mb-16 px-4'>
          <p className={`text-base md:text-lg max-w-3xl text-center font-bold leading-relaxed transition-colors duration-300 ${
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


        <div className="flex justify-center space-x-6 mb-12">
          <button
            onClick={scrollToHow}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold px-6 py-3 rounded-lg transition-colors duration-300"
          >
            How It Works
          </button>
          <button
            className={`px-8 py-4 rounded-lg transition-colors duration-300 font-bold ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-800 text-white'
                : 'bg-white hover:bg-gray-100 text-purple-600 border-4 border-purple-400 '
            }`}
            onClick={() => navigate("/login")}
          >
            Get Started
          </button>
        </div>
        
      </div>
    </section>
  );
}



