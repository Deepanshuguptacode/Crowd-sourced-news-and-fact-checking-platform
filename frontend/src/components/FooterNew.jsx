import React from 'react';
import { FaTwitter, FaFacebook, FaLinkedin, FaInstagram, FaGithub } from 'react-icons/fa';
import { useTheme } from './NavBar';
import logoTransparent from '../assets/logo-transparent.png';

export default function FooterNew({ scrollToTeam }) {
  const { isDarkMode } = useTheme();
  const currentYear = new Date().getFullYear();

  const navItems = [
    { label: 'Team', onClick: scrollToTeam },
  ];
  
  return (
    <footer className={`border-t pt-16 pb-8 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-[#0D1117] border-gray-700 text-[#C9D1D9]' 
        : 'bg-gray-100 border-gray-200 text-gray-900'
    }`}>
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div>
            <div className="flex items-center mb-4">
              <img src={logoTransparent} alt="Logo" className="w-10 h-10 mr-2" />
              <span className="text-xl font-bold bg-gradient-to-r from-sky-500 to-emerald-400 bg-clip-text text-transparent">VoxVeritas</span>
            </div>
            <p className={`mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Fighting misinformation through community-powered fact-checking.
            </p>
            <div className="flex space-x-4">
              <a href="#" className={`hover:text-sky-500 transition-colors ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <FaTwitter />
              </a>
              <a href="#" className={`hover:text-sky-500 transition-colors ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <FaFacebook />
              </a>
              <a href="#" className={`hover:text-sky-500 transition-colors ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <FaLinkedin />
              </a>
              <a href="#" className={`hover:text-sky-500 transition-colors ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <FaInstagram />
              </a>
              <a href="#" className={`hover:text-sky-500 transition-colors ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <FaGithub />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className={`font-bold text-lg mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-[#C9D1D9]' : 'text-gray-900'
            }`}>Quick Links</h4>
            <ul className="space-y-2">
              <li><button className={`hover:text-sky-500 transition-colors link-underline ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
              onClick={scrollToTeam}>About Us</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className={`font-bold text-lg mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-[#C9D1D9]' : 'text-gray-900'
            }`}>Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className={`hover:text-sky-500 transition-colors link-underline ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Fact-Checking Guide</a></li>

            </ul>
          </div>
          
          
        </div>
        
        <div className={`pt-8 border-t text-center transition-colors duration-300 ${
          isDarkMode 
            ? 'border-gray-700 text-gray-300' 
            : 'border-gray-200 text-gray-600'
        }`}>
          © {currentYear} VoxVeritas. All rights reserved.
        </div>
      </div>
    </footer>
  );
}