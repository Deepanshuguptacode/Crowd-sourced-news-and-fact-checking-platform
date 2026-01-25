import React, { useState, useEffect } from 'react';
import logoTransparent from '../assets/logo-transparent.png';

const AnimatedLogo = ({ size = 'w-12 h-12', brandName = 'VoxVeritas', showBrand = true, isDarkMode }) => {
  const [showLogo, setShowLogo] = useState(true);
  
  // Use the passed isDarkMode prop instead of managing own theme state
  const currentTheme = isDarkMode !== undefined ? isDarkMode : (localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const interval = setInterval(() => {
      setShowLogo(prev => !prev);
    }, 2500); // Switch every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative ${size} flex items-center justify-center`}>
      {/* Logo Image */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out ${
          showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <img 
          src={logoTransparent}
          alt="Logo"
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback if images don't exist
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        {/* Fallback icon if images don't exist */}
        <div 
          className="w-full h-full bg-gradient-to-br from-sky-500 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-lg"
          style={{ display: 'none' }}
        >
          {brandName.charAt(0)}
        </div>
      </div>
      
      {/* Brand Name */}
      {showBrand && (
        <div 
          className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out ${
            !showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <span className="text-2xl font-bold bg-gradient-to-r from-sky-500 to-emerald-400 bg-clip-text text-transparent whitespace-nowrap">
            {brandName}
          </span>
        </div>
      )}
    </div>
  );
};

export default AnimatedLogo;
