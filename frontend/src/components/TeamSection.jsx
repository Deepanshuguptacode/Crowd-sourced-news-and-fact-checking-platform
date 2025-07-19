import React from 'react';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLinkedin, FaGithub } from 'react-icons/fa';
import { useTheme } from './NavBar';

export default function TeamSection() {
  const { isDarkMode } = useTheme();
  
  const teamMembers = [
    {
      name: "Anantu Rajesh",
      role: "Frontend Developer",
      social: { gmail: "rajeshanantu@gmail.com", linkedin: "https://www.linkedin.com/in/anantu-rajesh-22a78a2b5/", github: "https://github.com/Anantu-Rajesh" },
      image: "src/assets/anantu.jpg" // Placeholder image
    },
    {
      name: "Deepanshu Gupta",
      role: "Backend & Gen-AI Engineer",
      social: { gmail: "deepanshugupta650@gmail.com", linkedin: "https://www.linkedin.com/in/deepanshu-gupta-650d/", github: "https://github.com/Deepanshuguptacode" },
      image: "src/assets/deepanshu.jpg" // Placeholder image
    },

  ];

  return (
    <section className={`py-20 transition-colors duration-300 ${
      isDarkMode ?  'bg-gray-800' : 'bg-white'
    }`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
          style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Our Team
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {teamMembers.map((member, index) => (
            <motion.div 
              key={index}
              className={`p-1 rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all group border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 hover:border-blue-500/50' 
                  : 'bg-white border-gray-200 hover:border-blue-500/50'
              }`}
              whileHover={{ y: -10 }}
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div className="bg-gradient-to-r from-blue-500 to-teal-500 p-1 rounded-2xl">
                <div className={`rounded-xl p-8 text-center h-full min-h-[440px] flex flex-col justify-center ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <div className="w-64 h-64 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 p-1">
                    <img src={member.image} alt={member.name} className="w-full h-full rounded-full" />
                  </div>
                  <h3 className={`text-xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`} style={{ fontFamily: "'Montserrat', sans-serif" }}>{member.name}</h3>
                  <p className={`mb-4 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`} style={{ fontFamily: "'Montserrat', sans-serif" }}>{member.role}</p>
                  
                  <div className="flex justify-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={`mailto:${member.social.gmail}`} className="text-blue-500 hover:text-blue-400 transition-colors">
                      <FaEnvelope />
                    </a>
                    <a href={member.social.linkedin} className="text-blue-500 hover:text-blue-400 transition-colors">
                      <FaLinkedin />
                    </a>
                    <a href={member.social.github} className="text-blue-500 hover:text-blue-400 transition-colors">
                      <FaGithub />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
      </div>
    </section>
  );
}