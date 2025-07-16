// src/components/HeroSection.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaUsers } from 'react-icons/fa';
import CountUp from 'react-countup';
import VisibilitySensor from 'react-visibility-sensor';
import { useNavigate } from 'react-router-dom';

export default function HeroSection({ scrollToHow }) {
  const [startCount, setStartCount] = useState(false);
  const navigate = useNavigate();
  
  // Start count animation when component mounts
  useEffect(() => {
    const timer = setTimeout(() => setStartCount(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative bg-gradient-to-r from-teal to-charcoal py-24 text-white overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] bg-[url('data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'40\' height=\'40\' fill=\'%23fff\' fill-opacity=\'0.05\'/%3E%3C/svg%3E')] animate-spin-slow"
        />
      </div>
      
      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.h1 
          className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Fight <span className="text-gold">Misinformation</span> Together
        </motion.h1>
        
        <motion.p 
          className="text-xl mb-10 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          A community-powered platform where truth prevails through collective verification
        </motion.p>
        
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <motion.button 
            onClick={scrollToHow}
            className="bg-gold text-charcoal px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaSearch className="mr-2" /> Learn How It Works
          </motion.button>
          
          <motion.button 
            className="border-2 border-gold text-gold px-8 py-4 rounded-xl font-bold hover:bg-gold hover:text-charcoal transition-all flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
          >
            <FaUsers className="mr-2" /> Join the Movement
          </motion.button>
        </div>
        
        {/* Stats Section with CountUp */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <StatCard 
            end={10} 
            suffix="k+" 
            label="Articles reviewed by our community" 
            startCount={startCount} 
          />
          <StatCard 
            end={93} 
            suffix="%" 
            label="Accuracy in AI-powered detection" 
            startCount={startCount} 
          />
          <StatCard 
            end={4.8} 
            suffix="★" 
            decimals={1}
            label="Average trust score from our users" 
            startCount={startCount} 
          />
        </div>
      </div>
    </section>
  );
}

const StatCard = ({ end, suffix, label, startCount, decimals = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <VisibilitySensor 
      onChange={(visible) => visible && setIsVisible(true)}
      partialVisibility
      offset={{ bottom: 100 }}
    >
      <motion.div 
        className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <div className="text-3xl font-bold text-gold mb-1">
          {(isVisible || startCount) ? (
            <CountUp
              start={0}
              end={end}
              suffix={suffix}
              decimals={decimals}
              duration={2.5}
              separator=","
              decimal="."
              delay={0.1}
              className="count-up"
              key={isVisible || startCount ? 'countup-animate' + end : 'countup-static' + end}
            />
          ) : (
            decimals > 0 ? `0.${'0'.repeat(decimals)}` : "0"
          )}
        </div>
        <div className="text-sm text-white/80">{label}</div>
      </motion.div>
    </VisibilitySensor>
  );
};