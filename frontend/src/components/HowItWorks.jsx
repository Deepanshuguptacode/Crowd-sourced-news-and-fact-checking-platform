import React from 'react';
import { motion } from 'framer-motion';
import { FaNewspaper, FaUsers, FaUserCheck, FaRobot, FaCheckCircle } from 'react-icons/fa';

export default function HowItWorks() {
  const steps = [
    { icon: <FaNewspaper className="text-2xl" />, title: "Submit News", description: "Users upload suspicious news with screenshots or links" },
    { icon: <FaUsers className="text-2xl" />, title: "Community Review", description: "Verified community members vote on credibility" },
    { icon: <FaUserCheck className="text-2xl" />, title: "Expert Analysis", description: "Journalists and fact-checkers provide professional input" },
    { icon: <FaRobot className="text-2xl" />, title: "AI Assistance", description: "Our algorithms flag potential misinformation patterns" },
    { icon: <FaCheckCircle className="text-2xl" />, title: "Verified Results", description: "Get a clear credibility rating for each news item" }
  ];

  return (
    <section className="py-20 bg-offwhite relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-40 h-40 bg-teal-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-10 right-10 w-60 h-60 bg-gold/10 rounded-full blur-3xl opacity-30"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-charcoal">
          How It <span className="text-teal">Works</span>
        </h2>
        
        <div className="relative">
          {/* Vertical timeline */}
          <div className="hidden md:block absolute left-1/2 top-16 bottom-16 w-1 bg-teal-200 transform -translate-x-1/2"></div>
          
          <div className="grid md:grid-cols-5 gap-8">
            {steps.map((step, index) => (
              <TimelineStep 
                key={index} 
                icon={step.icon}
                title={step.title}
                description={step.description}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const TimelineStep = ({ icon, title, description, index }) => (
  <motion.div 
    className={`flex flex-col items-center text-center ${index % 2 === 0 ? 'md:mb-0' : 'md:mt-16'}`}
    data-aos="fade-up"
    data-aos-delay={index * 100}
  >
    <div className="w-20 h-20 rounded-full bg-white border-4 border-teal flex items-center justify-center text-teal mb-6 z-10 shadow-lg">
      {icon}
    </div>
    <div className="relative bg-white p-6 rounded-2xl shadow-xl border-t-4 border-teal hover:shadow-2xl transition-all duration-300">
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-teal text-white rounded-full flex items-center justify-center font-bold">
        {index + 1}
      </div>
      <h3 className="text-xl font-bold mb-3 text-charcoal">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
    {index < 4 && (
      <div className="md:hidden mt-8 text-teal text-2xl">↓</div>
    )}
  </motion.div>
);