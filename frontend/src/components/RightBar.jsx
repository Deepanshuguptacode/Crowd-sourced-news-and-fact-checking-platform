import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Icon = ({ path }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
);

const RightBar = () => {
  const navigate = useNavigate();
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `.perspective-1000{perspective:1000px}.transform-style-preserve-3d{transform-style:preserve-3d}.backface-hidden{backface-visibility:hidden}.rotate-x-180{transform:rotateX(180deg)}.group:hover .group-hover\\:rotate-x-180{transform:rotateX(180deg)}`;
    document.head.appendChild(style);
    return () => document.head.contains(style) && document.head.removeChild(style);
  }, []);

  const menuItems = [
    { path: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: 'Home', action: () => navigate('/home') },
    { path: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", label: 'Trending', action: () => navigate('/trending') },
    { path: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", label: 'Test Accuracy', action: () => navigate('/test-accuracy') },
    { path: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", label: 'Debate Rooms', action: () => navigate('/debate-rooms') },
    { path: "M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", label: 'Know Us', action: () => setShowContactDropdown(!showContactDropdown) },
  ];

  const colors = { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', icon: 'text-blue-600 dark:text-blue-400', hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20' };

  return (
    <div className="w-full space-y-4">
      <div className="space-y-1">
        {menuItems.map((item, index) => {
          const isDebateRoom = item.label === 'Debate Rooms';
          const isKnowUs = item.label === 'Know Us';
          const isActive = item.label === 'Home' || (isKnowUs && showContactDropdown);
          
          return (
            <div key={index}>
              <button
                onClick={item.action}
                className={`flex items-center w-full px-3 py-3 text-left transition-all duration-200 rounded-lg group ${isActive ? `${colors.bg} ${colors.text}` : `${colors.hover} text-gray-700 dark:text-gray-300`}`}
              >
                <div className={`w-6 h-6 flex items-center justify-center mr-3 transition-colors duration-200 ${isActive ? colors.icon : `text-gray-500 dark:text-gray-400 group-hover:${colors.icon.split(' ')[0]}`}`}>
                  <Icon path={item.path} />
                </div>
                
                {isDebateRoom ? (
                  <div className="relative w-full h-6 perspective-1000">
                    <div className="absolute inset-0 transition-transform duration-500 transform-style-preserve-3d group-hover:rotate-x-180">
                      <span className="absolute inset-0 flex items-center font-medium backface-hidden">{item.label}</span>
                      <span className="absolute inset-0 flex items-center font-medium backface-hidden rotate-x-180">VoxSpace</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{item.label}</span>
                    {isKnowUs && (
                      <svg className={`w-4 h-4 transition-transform duration-200 ${showContactDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                )}
              </button>

              {isKnowUs && showContactDropdown && (
                <div className="mt-2 ml-6 space-y-1 animate-in slide-in-from-top-2 duration-200">
                  {[
                    { name: 'Anantu Rajesh', url: 'https://1drv.ms/b/c/e7a646ee605c5de9/EZ9ksGsvoJlHptP0qGwy9E4BXk2D5WgG_y-zQh6IJGrD4Q?e=7i9c0J' },
                    { name: 'Deepanshu Gupta', url: 'https://1drv.ms/w/c/a98ec36420258513/EczRlPK_pOBMqKey_vKMZG8BEr4J3RJuTeYXq2BeUm_ygQ?e=kdzvxt' }
                  ].map((person, i) => (
                    <a key={i} href={person.url} target="_blank" rel="noopener noreferrer" className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200">
                      {person.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <button onClick={() => navigate('/submit-news')} className="w-full flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-md group">
          <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          <span className="ml-3">Submit News</span>
        </button>
      </div>
    </div>
  );
};

export default RightBar;