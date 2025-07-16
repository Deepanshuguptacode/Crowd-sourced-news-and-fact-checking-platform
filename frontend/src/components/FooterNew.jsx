import React from 'react';
import { FaTwitter, FaFacebook, FaLinkedin, FaInstagram, FaGithub } from 'react-icons/fa';

export default function FooterNew(scrollToHow, scrollToTeam) {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-charcoal text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">🔍</span>
              <span className="text-xl font-bold">TruthCheck</span>
            </div>
            <p className="text-gray-400 mb-4">
              Fighting misinformation through community-powered fact-checking.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gold transition-colors">
                <FaTwitter />
              </a>
              <a href="#" className="text-gray-400 hover:text-gold transition-colors">
                <FaFacebook />
              </a>
              <a href="#" className="text-gray-400 hover:text-gold transition-colors">
                <FaLinkedin />
              </a>
              <a href="#" className="text-gray-400 hover:text-gold transition-colors">
                <FaInstagram />
              </a>
              <a href="#" className="text-gray-400 hover:text-gold transition-colors">
                <FaGithub />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-gold transition-colors link-underline">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-gold transition-colors link-underline">How It Works</a></li>
              <li><a href="#" className="text-gray-400 hover:text-gold transition-colors link-underline">Blog</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-4 text-white">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-gold transition-colors link-underline">Fact-Checking Guide</a></li>

            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-4 text-white">Contact Us</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start">
                <span className="mr-2 text-gold">✉️</span>
                <span>contact@truthcheck.org</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-gold">📱</span>
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-gold">🏢</span>
                <span>San Francisco, CA</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-700 text-center text-gray-400">
          © {currentYear} TruthCheck. All rights reserved.
        </div>
      </div>
    </footer>
  );
}