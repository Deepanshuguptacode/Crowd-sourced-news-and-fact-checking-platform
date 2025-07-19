import React from 'react';
import { motion } from 'framer-motion';
import { FaUpload, FaShieldAlt, FaLayerGroup, FaUsers, FaChartLine, FaSoundcloud } from 'react-icons/fa';
import { useTheme } from './NavBar';

// Add custom styles for 3D flip effect
const flipCardStyles = `
  .transform-style-preserve-3d {
    transform-style: preserve-3d;
  }
  .backface-hidden {
    backface-visibility: hidden;
  }
  .rotate-y-180 {
    transform: rotateY(180deg);
  }
  .group:hover .group-hover\\:rotate-y-180 {
    transform: rotateY(180deg);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = flipCardStyles;
  document.head.appendChild(styleSheet);
}

const KeyFeature = ({ scrollToFeatures }) => {
  const { isDarkMode } = useTheme();

  const features = [
    {
      id: 1,
      icon: <FaUpload className="text-3xl" />,
      title: "Crowd-Sourced Submission",
      description: "Empower anyone to break news—upload stories, images, or video.",
      color: "from-purple-500 to-purple-600"
    },
    {
      id: 2,
      icon: <FaShieldAlt className="text-3xl" />,
      title: "Multi-Tier Verification",
      description: "Normal users submit → Community users review → Experts give final sign-off.",
      color: "from-blue-500 to-blue-600"
    },
    {
      id: 3,
      icon: <FaLayerGroup className="text-3xl" />,
      title: "Comment Clustering",
      description: "Similar viewpoints auto-grouped so you see the consensus at a glance.",
      color: "from-green-500 to-green-600"
    },
    {
      id: 4,
      icon: <FaUsers className="text-3xl" />,
      title: "Debate Room",
      description: "Unique pro-vs-con debate spaces—rare in news platforms—to hash out every angle.",
      color: "from-orange-500 to-orange-600"
    },
    {
      id: 5,
      icon: <FaChartLine className="text-3xl" />,
      title: "Trending & Notifications",
      description: "Stay on top of hot stories, verified updates, and fresh debate turns.",
      color: "from-red-500 to-red-600"
    },
    {
      id: 6,
      icon: <FaSoundcloud className="text-3xl" />,
      title: "Podcast Episodes",
      description: "Listen to full debate-room discussions as on‑demand audio episodes.",
      color: "from-yellow-500 to-yellow-600"
    }
  ];

  return (
    <section className={`py-20 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Title */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`} style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Key Features
            </h2>
            <p className={`text-lg md:text-xl max-w-3xl mx-auto transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`} style={{ fontFamily: "'Inter', sans-serif" }}>
              Discover the features that make VoxVeritas the most comprehensive fact-checking platform
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                className="group relative cursor-pointer h-64"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                viewport={{ once: true }}
                style={{ perspective: "1000px" }}
              >
                {/* Card Container with 3D flip */}
                <div className="relative w-full h-full transition-transform duration-700 transform-style-preserve-3d group-hover:rotate-y-180">
                  
                  {/* Front of card */}
                  <div className={`absolute inset-0 w-full h-full rounded-2xl shadow-lg border backface-hidden ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-200'
                  }`}>
                    {/* Number Badge */}
                    <div className={`absolute -top-4 -left-4 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg bg-gradient-to-r ${feature.color}`}>
                      {feature.id}
                    </div>

                    {/* Front Content */}
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      {/* Icon */}
                      <div className={`inline-flex p-4 rounded-xl mb-6 bg-gradient-to-r ${feature.color} text-white justify-center items-center w-16 h-16`}>
                        {feature.icon}
                      </div>

                      {/* Title */}
                      <h3 className={`text-xl md:text-2xl font-bold transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`} style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        {feature.title}
                      </h3>
                    </div>
                  </div>

                  {/* Back of card */}
                  <div className={`absolute inset-0 w-full h-full rounded-2xl shadow-lg border backface-hidden rotate-y-180 ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-200'
                  }`}>
                    {/* Back Content */}
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      {/* Small icon */}
                      <div className={`inline-flex p-2 rounded-lg mb-4 bg-gradient-to-r ${feature.color} text-white justify-center items-center w-10 h-10`}>
                        <div className="text-lg">
                          {React.cloneElement(feature.icon, { className: "text-lg" })}
                        </div>
                      </div>             
                      {/* Description */}
                      <p className={`text-lg leading-relaxed transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`} style={{ fontFamily: "'Inter', sans-serif" }}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default KeyFeature;
