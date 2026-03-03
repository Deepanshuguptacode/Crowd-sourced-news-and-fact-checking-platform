import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AnimatedLogo from './AnimatedLogo';
import TourButton from './TourButton';

const NavigationHeader = ({ showBackButton = true }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed w-full top-0 z-50 bg-white/90 dark:bg-[#0D1117] backdrop-blur-md border-b border-gray-200/50 dark:border-slate-700/50">
      <div className="flex justify-between items-center px-6 py-4">
        {/* Logo */}
        <div className="mx-6 flex items-center">
          <AnimatedLogo size="w-10 h-10" brandName='VoxVeritas' showBrand={true} />
        </div>

        {/* Tour Button and Back Button */}
        <div className="flex items-center space-x-3">
          <TourButton />
          
          {/* Back Button */}
          {showBackButton && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100/50 hover:bg-gray-200/50 dark:bg-slate-700/50 dark:hover:bg-slate-600/50 text-gray-700 dark:text-white rounded-xl transition-all duration-200 backdrop-blur-sm border border-gray-300/50 dark:border-slate-600/50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavigationHeader;
