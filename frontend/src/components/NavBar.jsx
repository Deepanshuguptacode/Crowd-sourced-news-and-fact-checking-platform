import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NavBar({ scrollToWhy, scrollToHow, scrollToTeam }) {
  const navigate = useNavigate();
  return (
    <nav className="bg-teal text-white p-4 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold flex items-center">
          <span className="mr-2">🔍</span>
          TruthCheck
        </div>
        <div className="flex space-x-6">
          <button 
            onClick={scrollToWhy} 
            className="hover:text-gold transition-colors font-medium"
          >
            Why
          </button>
          <button 
            onClick={scrollToHow} 
            className="hover:text-gold transition-colors font-medium"
          >
            How It Works
          </button>
          <button 
            onClick={scrollToTeam} 
            className="hover:text-gold transition-colors font-medium"
          >
            Team
          </button>
          <button
            className="bg-gold text-charcoal px-4 py-2 rounded-lg hover:bg-gold-dark transition font-bold"
            onClick={() => navigate('/login')}
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}