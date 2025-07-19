import React, { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; 

// Theme Context
const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const AnimatedLogo = () => {
  const [showLogo, setShowLogo] = useState(true);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const interval = setInterval(() => {
      setShowLogo(prev => !prev);
    }, 2500); // Switch every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      {/* Logo SVG */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out ${
          showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <img 
          src={isDarkMode ? 'src/assets/logo-dark.png' : 'src/assets/logo-light.png'}
          alt="Logo"
        />
      </div>
      {/* Brand Name */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out ${
          !showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent">
          VoxVeritas
        </span>
      </div>
    </div>
  );
};

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative p-2.5 rounded-full transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
      }`}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon */}
        <svg
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            isDarkMode ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>
        
        {/* Moon Icon */}
        <svg
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            isDarkMode ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </div>
    </button>
  );
};

export default function NavBar({ 
  scrollToHero, 
  scrollToAbout, 
  scrollToFeatures,  
  scrollToProblem, 
  scrollToTeam 
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Hero', onClick: scrollToHero },
    { label: 'About', onClick: scrollToAbout },
    { label: 'Features', onClick: scrollToFeatures },
    { label: 'Problem', onClick: scrollToProblem },
    { label: 'Team', onClick: scrollToTeam },
  ];

  const handleNavClick = (onClick) => {
    onClick();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className={`${
        isDarkMode 
          ? 'bg-gray-800/95 border-gray-700' 
          : 'bg-white/95 border-gray-200'
      } backdrop-blur-lg border-b sticky top-0 z-50 shadow-2xl transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Left - Animated Logo and Brand */}
            <div className="flex items-center group cursor-pointer hover:scale-105 transition-transform duration-300">
              <AnimatedLogo />
            </div>

            {/* Center - Navigation Links */}
            <div className="hidden lg:flex justify-center items-center space-x-2">
              {navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className={`relative px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ease-in-out group overflow-hidden ${
                    isDarkMode
                      ? 'text-gray-200 hover:text-purple-400'
                      : 'text-gray-700 hover:text-purple-600'
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>
                  <div className={`absolute inset-0 bg-gradient-to-r rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 ease-out ${
                    isDarkMode
                      ? 'from-purple-500/20 to-purple-400/20'
                      : 'from-purple-500/10 to-purple-400/10'
                  }`}></div>
                  <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-purple-400 group-hover:w-full group-hover:left-0 transition-all duration-300"></div>
                </button>
              ))}
            </div>

            {/* Right - Theme Toggle and Get Started Button */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={() => navigate("/login")}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-8 py-3 rounded-full font-bold hover:shadow-xl hover:shadow-purple-500/25 hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-purple-500/30 relative overflow-hidden group"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
                  isDarkMode
                    ? 'text-gray-200 hover:text-purple-400 hover:bg-gray-700'
                    : 'text-gray-700 hover:text-purple-600 hover:bg-gray-100'
                }`}
              >
                <svg 
                  className={`w-6 h-6 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-90' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
          <div className={`px-4 pt-2 pb-4 space-y-2 backdrop-blur-lg border-t ${
            isDarkMode
              ? 'bg-gray-800/95 border-gray-700'
              : 'bg-white/95 border-gray-200'
          }`}>
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleNavClick(item.onClick)}
                className={`block w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
                  isDarkMode
                    ? 'text-gray-200 hover:text-purple-400 hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-purple-400/20'
                    : 'text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-purple-400/10'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 flex space-x-2">
              <ThemeToggle />
              <button className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200" onClick={() => navigate("/login")}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
