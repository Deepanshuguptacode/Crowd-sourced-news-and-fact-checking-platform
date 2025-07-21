import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';



const RightBar = () => {
  const navigate = useNavigate();
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  // Add CSS for 3D flip effect
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .perspective-1000 {
        perspective: 1000px;
      }
      .transform-style-preserve-3d {
        transform-style: preserve-3d;
      }
      .backface-hidden {
        backface-visibility: hidden;
      }
      .rotate-x-180 {
        transform: rotateX(180deg);
      }
      .group:hover .group-hover\\:rotate-x-180 {
        transform: rotateX(180deg);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const handlePostClick = () => {
    navigate('/submit-news');
  };

  // Custom SVG Icons
  const HomeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );

  const TrendingIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );  

  const ContactIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  const DebateIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );

  const EditIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  const menuItems = [
    { icon: HomeIcon, label: 'Home', color: 'blue', action: () => navigate('/home') },
    { icon: TrendingIcon, label: 'Trending', color: 'orange', action: () => navigate('/trending') },
    { icon: DebateIcon, label: 'Debate Rooms', color: 'green', action: () => navigate('/debate-rooms') },
    { icon: ContactIcon, label: 'Know Us', color: 'purple', action: () => setShowContactDropdown(!showContactDropdown) },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Menu Items */}
      <div className="space-y-1">
        {menuItems.map((item, index) => {
          const IconComponent = item.icon;
          const isDebateRoom = item.label === 'Debate Rooms';
          const isContactUs = item.label === 'Contact Us';
          
          return (
            <div key={index} className="relative">
              <button
                onClick={item.action}
                className={`flex items-center w-full px-3 py-3 text-left transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg group relative overflow-hidden ${
                  item.label === 'Home' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' 
                    : isContactUs && showContactDropdown
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className={`w-6 h-6 flex items-center justify-center mr-3 transition-colors duration-200 ${
                  item.label === 'Home'
                    ? 'text-blue-600 dark:text-blue-400'
                    : isContactUs && showContactDropdown
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                }`}>
                  <IconComponent />
                </div>
                
                {isDebateRoom ? (
                  <div className="relative w-full h-6 perspective-1000">
                    <div className="absolute inset-0 transition-transform duration-500 transform-style-preserve-3d group-hover:rotate-x-180">
                      {/* Front face - Debate Rooms */}
                      <span className="absolute inset-0 flex items-center font-medium backface-hidden">
                        {item.label}
                      </span>
                      {/* Back face - VoxSpace */}
                      <span className="absolute inset-0 flex items-center font-medium backface-hidden rotate-x-180">
                        VoxSpace
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{item.label}</span>
                    {isContactUs && (
                      <svg 
                        className={`w-4 h-4 transition-transform duration-200 ${showContactDropdown ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                )}
              </button>

              {/* Contact Us Dropdown */}
              {isContactUs && showContactDropdown && (
                <div className="mt-2 ml-6 space-y-1 animate-in slide-in-from-top-2 duration-200">
                  <a
                    href="https://1drv.ms/b/c/e7a646ee605c5de9/EZ9ksGsvoJlHptP0qGwy9E4BXk2D5WgG_y-zQh6IJGrD4Q?e=7i9c0J" // Replace with your first file link
                    className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors duration-200"
                  >
                    Anantu Rajesh
                  </a>
                  <a
                    href="https://1drv.ms/w/c/a98ec36420258513/EczRlPK_pOBMqKey_vKMZG8BEr4J3RJuTeYXq2BeUm_ygQ?e=kdzvxt" // Replace with your second file link
                    className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors duration-200"
                  >
                    Deepanshu Gupta
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit News Button */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handlePostClick}
          className="w-full flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-md group"
        >
          <div className="w-5 h-5 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
            <EditIcon />
          </div>
          <span>Submit News</span>
        </button>
      </div>

    </div>
  );
};

export default RightBar;
