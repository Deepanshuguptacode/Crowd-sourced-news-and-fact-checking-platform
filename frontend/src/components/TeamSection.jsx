import React from 'react';
import { motion } from 'framer-motion';
import { FaTwitter, FaLinkedin, FaGithub } from 'react-icons/fa';

export default function TeamSection() {
  const teamMembers = [
    {
      name: "Alex Johnson",
      role: "Frontend Developer",
      social: { twitter: "#", linkedin: "#", github: "#" }
    },
    {
      name: "Sam Wilson",
      role: "Backend Engineer",
      social: { twitter: "#", linkedin: "#", github: "#" }
    },
    {
      name: "Taylor Chen",
      role: "Frontend Developer",
      social: { twitter: "#", linkedin: "#", github: "#" }
    },

  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-charcoal">
            Our <span className="text-teal">Team</span>
          </h2>
          <div className="w-24 h-1 bg-gold mx-auto mb-6"></div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {teamMembers.map((member, index) => (
            <motion.div 
              key={index}
              className="bg-white p-1 rounded-2xl shadow-lg hover:shadow-xl transition-all group"
              whileHover={{ y: -10 }}
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div className="bg-gradient-to-r from-teal to-gold p-1 rounded-2xl">
                <div className="bg-white rounded-xl p-6 text-center h-full">
                  <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-r from-teal to-gold p-1">
                    <div className="bg-white w-full h-full rounded-full flex items-center justify-center text-4xl text-teal">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-charcoal">{member.name}</h3>
                  <p className="text-gold mb-3">{member.role}</p>
                  <p className="text-gray-600 mb-4">{member.bio}</p>
                  
                  <div className="flex justify-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={member.social.twitter} className="text-teal hover:text-teal-700">
                      <FaTwitter />
                    </a>
                    <a href={member.social.linkedin} className="text-teal hover:text-teal-700">
                      <FaLinkedin />
                    </a>
                    <a href={member.social.github} className="text-teal hover:text-teal-700">
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