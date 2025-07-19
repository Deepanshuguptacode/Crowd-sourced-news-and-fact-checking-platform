import React, { useState } from 'react';
import { useTheme } from './NavBar';

const About = () => {
  const { isDarkMode } = useTheme();
  const [voxHovered, setVoxHovered] = useState(false);
  const [veritasHovered, setVeritasHovered] = useState(false);

  return (
    <section className={`py-20 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`} style={{ fontFamily: "'Montserrat', sans-serif" }}>
              What is VoxVeritas?
            </h2>
          </div>

          {/* Three Column Layout */}
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center min-h-[400px]">
              
              {/* Left Column - VOX */}
              <div 
                className="flex justify-center items-center cursor-pointer w-full h-full py-8"
                onMouseEnter={() => setVoxHovered(true)}
                onMouseLeave={() => setVoxHovered(false)}
              >
              <div className="text-center group w-full ">
                <div className={`text-3xl md:text-8xl font-bold mb-4 transition-all duration-1000 ease-in-out transform ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                } ${voxHovered ? 'scale-110' : 'scale-100'}`}
                style={{ 
                  fontFamily: "'Montserrat', sans-serif",
                  letterSpacing: '0.05em'
                }}>
                  {voxHovered ? (
                    <div className="text-3xl md:text-3xl leading-tight">
                      VOICE<br/>OF
                    </div>
                  ) : (
                    'VOX'
                  )}
                </div>
                <p className={`text-sm uppercase tracking-wider transition-all duration-800 ease-in-out ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`} style={{ fontFamily: "'Inter', sans-serif" }}>
                  {voxHovered ? 'Vox' : 'Latin of: Voice'}
                </p>
              </div>
            </div>

            {/* Center Column - LOGO */}
            <div className="flex justify-center">
              <div className="text-center">
                {/* Site Logo/Icon */}
                <div className={`w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center  transition-all duration-700 ease-in-out transform hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-purple-600 to-purple-800' 
                    : 'bg-gradient-to-br from-purple-100 to-purple-200'
                }`}>
                  {/* Globe/Truth Icon */}
                  <img 
                    src={isDarkMode ? 'src/assets/logo-dark.png' : 'src/assets/logo-light.png'} 
                    alt="VoxVeritas Logo" 
                    className="w-32 h-32"
                />
                </div>
                <h3 className={`text-2xl font-bold transition-all duration-500 ease-in-out ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`} style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  VoxVeritas
                </h3>
                <p className={`text-sm mt-2 transition-all duration-500 ease-in-out ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`} style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  Truth Through Community
                </p>
              </div>
            </div>

            {/* Right Column - VERITAS */}
            <div 
              className="flex justify-center items-center cursor-pointer w-full h-full py-8"
              onMouseEnter={() => setVeritasHovered(true)}
              onMouseLeave={() => setVeritasHovered(false)}
            >
              <div className="text-center group w-full">
                <div className={`text-6xl md:text-8xl font-bold mb-4 transition-all duration-1000 ease-in-out transform ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
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
                  {veritasHovered ? 'Veritas' : 'Latin of: Truth'}
                </p>
              </div>
            </div>
          </div>
          </div>

          {/* Bottom Description */}
          <div className="text-center mt-8 max-w-4xl mx-auto">
            <p className={`text-lg md:text-xl leading-relaxed transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`} style={{ 
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.01em'
            }}>
              <span className="bg-gradient-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent font-semibold">
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
