import React, { useState } from 'react';
import { useTheme } from './NavBar';
import logoLight from '../assets/logo-light.jpg';
import logoDark from '../assets/logo-dark.jpg';

const About = () => {
  const { isDarkMode } = useTheme();
  const [voxHovered, setVoxHovered] = useState(false);
  const [veritasHovered, setVeritasHovered] = useState(false);

  return (
    <section className={`about-section py-20 transition-colors duration-300 ${
      isDarkMode ? 'bg-[#15191f]' : 'bg-white'
    }`}>
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-16" data-scroll>
            <h2 className={`text-4xl md:text-5xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`} style={{ fontFamily: "'Montserrat', sans-serif" }}>
              What is VoxVeritas?
            </h2>
          </div>

          {/* Three Row Layout */}
          <div className="max-w-6xl mx-auto space-y-16">
            {/* First Row - VOX */}
            <div className="flex justify-center" data-scroll data-scroll-speed="2">
              <div 
                className="flex justify-center items-center cursor-pointer"
                onMouseEnter={() => setVoxHovered(true)}
                onMouseLeave={() => setVoxHovered(false)}
              >
                <div className="text-center group">
                  <div className={`text-6xl md:text-8xl font-bold mb-4 transition-all duration-1000 ease-in-out transform ${
                    isDarkMode ? 'text-sky-400' : 'text-sky-600'
                  } ${voxHovered ? 'scale-110' : 'scale-100'}`}
                  style={{ 
                    fontFamily: "'Montserrat', sans-serif",
                    letterSpacing: '0.05em'
                  }}>
                    {voxHovered ? (
                      <div className="text-3xl md:text-4xl leading-tight">
                        VOICE<br/>OF
                      </div>
                    ) : (
                      'VOX'
                    )}
                  </div>
                  <p className={`text-sm uppercase tracking-wider transition-all duration-800 ease-in-out ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`} style={{ fontFamily: "'Inter', sans-serif" }}>
                    {voxHovered ? 'Vox' : 'Latin: Voice'}
                  </p>
                </div>
              </div>
            </div>

            {/* Second Row - Logo */}
            <div className="flex items-center justify-center" data-scroll data-scroll-speed="3">
              <div className="text-center">
                <div className={`w-40 h-40 mx-auto pt-2 pr-0.5 mb-6 rounded-full flex items-center justify-center transition-all duration-700 ease-in-out transform hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-sky-600 to-emerald-600' 
                    : 'bg-gradient-to-br from-sky-100 to-emerald-100'
                }`}>
                  <img 
                    src={isDarkMode ? logoDark : logoLight} 
                    alt="VoxVeritas Logo" 
                    className="w-40 h-40 rounded-full"
                  />
                </div>
                <h3 className={`text-3xl font-bold transition-all duration-500 ease-in-out ${
                  isDarkMode ? 'text-[#C9D1D9]' : 'text-gray-900'
                }`} style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  VoxVeritas
                </h3>
                <p className={`text-base mt-2 transition-all duration-500 ease-in-out ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`} style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  Truth Through Community
                </p>
              </div>
            </div>

            {/* Third Row - VERITAS */}
            <div className="flex justify-center" data-scroll data-scroll-speed="4">
              <div 
                className="flex justify-center items-center cursor-pointer"
                onMouseEnter={() => setVeritasHovered(true)}
                onMouseLeave={() => setVeritasHovered(false)}
              >
                <div className="text-center group">
                  <div className={`text-6xl md:text-8xl font-bold mb-4 transition-all duration-1000 ease-in-out transform ${
                    isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                  } ${veritasHovered ? 'scale-110' : 'scale-100'}`}
                  style={{ 
                    fontFamily: "'Montserrat', sans-serif",
                    letterSpacing: '0.05em'
                  }}>
                    {veritasHovered ? (
                      <div className="text-4xl md:text-5xl">
                        TRUTH
                      </div>
                    ) : (
                      'VERITAS'
                    )}
                  </div>
                  <p className={`text-sm uppercase tracking-wider transition-all duration-800 ease-in-out ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`} style={{ fontFamily: "'Inter', sans-serif" }}>
                    {veritasHovered ? 'Veritas' : 'Latin: Truth'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Description */}
          <div className="text-center mt-16 max-w-4xl mx-auto" data-scroll data-scroll-speed="5">
            <p className={`text-lg md:text-xl leading-relaxed transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`} style={{ 
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.01em'
            }}>
              <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent font-semibold">
                VoxVeritas
              </span>{' '}
              combines the power of community voice with the pursuit of verified truth. 
              We empower users to submit, verify, and discuss news, ensuring accuracy through 
              collaborative fact-checking and expert validation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
