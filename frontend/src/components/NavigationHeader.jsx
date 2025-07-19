import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const NavigationHeader = ({ title = "NewsCheck", showBackButton = true, backRoute = "/home" }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed w-full top-0 z-50 flex justify-between items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 py-4 border-b border-gray-200/50 dark:border-slate-700/50 ">
      {/* Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-lg">N</span>
        </div>
        <span className="text-gray-900 dark:text-white font-semibold text-xl">{title}</span>
      </div>

      {/* Back Button */}
      {showBackButton && (
        <button
          onClick={() => navigate(backRoute)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100/50 hover:bg-gray-200/50 dark:bg-slate-700/50 dark:hover:bg-slate-600/50 text-gray-700 dark:text-white rounded-xl transition-all duration-200 backdrop-blur-sm border border-gray-300/50 dark:border-slate-600/50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </button>
      )}
    </div>
  );
};

export default NavigationHeader;
