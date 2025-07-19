import React from 'react';
import { useTheme } from './NavBar';
import { FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

export default function WhySection() {
  const { isDarkMode } = useTheme();
  
  const problems = [
    {
      id: 1,
      title: "Facts and rumors look the same.",
      description: "Without verification, truth and misinformation appear identical online."
    },
    {
      id: 2,
      title: "Endless comment threads obscure consensus.",
      description: "Important viewpoints get lost in chaotic comment sections."
    },
    {
      id: 3,
      title: "Debates go off-topic and unbalanced.",
      description: "Discussions lack structure and fair representation of all sides."
    },
    {
      id: 4,
      title: "Busy readers can't stay informed on the go.",
      description: "Text-heavy content doesn't work for multitasking lifestyles."
    },
    {
      id: 5,
      title: "No quick way to gauge a story's trustworthiness.",
      description: "Readers have no reliable indicator of content credibility."
    }
  ];

  const solutions = [
    {
      id: 1,
      title: "Multi-tier verification",
      description: "Crowd review + expert sign-off to flag what's true."
    },
    {
      id: 2,
      title: "Comment clustering",
      description: "Surface the most common viewpoints at a glance."
    },
    {
      id: 3,
      title: "Structured debate rooms",
      description: "FOR vs. AGAINST format keeps discussions fair and focused."
    },
    {
      id: 4,
      title: "Audio debates",
      description: "Transform text discussions into on-demand podcast episodes."
    },
    {
      id: 5,
      title: "Credibility scores",
      description: "Dynamically rate each submission based on verifications."
    }
  ];
  
  return (
    <section className={`py-16 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="container mx-auto px-4">
        <h2 className={`text-4xl font-bold text-center mb-12 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}
        style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Why We Built <span className="bg-gradient-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent">VoxVeritas</span>
        </h2>
        
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Problem Side */}
          <div className={`p-8 rounded-xl shadow-2xl border transition-all duration-500 transform hover:scale-105 hover:shadow-3xl group ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700 hover:border-red-500 hover:bg-red-900/20' 
              : 'bg-white border-gray-200 hover:border-red-500 hover:bg-red-50/50'
          }`}>
            <div className="flex justify-center items-center mb-6">
              <FaExclamationTriangle className="text-4xl mr-4 text-red-500" />
              <h3 className="text-3xl text-center font-bold text-red-500" style={{ fontFamily: "'Montserrat', sans-serif" }}>Problems</h3>
            </div>
            
            <div className="space-y-6">
              {problems.map((problem) => (
                <div 
                  key={problem.id}
                  className={`p-4 rounded-lg border-l-4 border-red-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg cursor-pointer ${
                    isDarkMode ? 'bg-gray-700/50 hover:bg-red-800/30' : 'bg-red-50 hover:bg-red-100'
                  }`}
                >
                  <h4 className={`font-bold mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{problem.title}</h4>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>{problem.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Solution Side */}
          <div className={`p-8 rounded-xl shadow-2xl border transition-all duration-500 transform hover:scale-105 hover:shadow-3xl group ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700 hover:border-green-500 hover:bg-green-900/20' 
              : 'bg-white border-gray-200 hover:border-green-500 hover:bg-green-50/50'
          }`}>
            <div className="flex justify-center items-center mb-6">
              <FaCheckCircle className="text-4xl mr-4 text-green-500" />
              <h3 className="text-3xl font-bold text-green-500" style={{ fontFamily: "'Montserrat', sans-serif" }}>Our Solutions</h3>
            </div>
            
            <div className="space-y-6">
              {solutions.map((solution) => (
                <div 
                  key={solution.id}
                  className={`p-4 rounded-lg border-l-4 border-green-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg cursor-pointer ${
                    isDarkMode ? 'bg-gray-700/50 hover:bg-green-800/30' : 'bg-green-50 hover:bg-green-100'
                  }`}
                >
                  <h4 className={`font-bold mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{solution.title}</h4>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>{solution.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}