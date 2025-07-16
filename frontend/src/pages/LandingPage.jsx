import React, { useRef } from 'react';
import NavBar from '../components/NavBar';
import HeroSection from '../components/HeroSection';
import WhySection from '../components/WhySection';
import HowItWorks from '../components/HowItWorks';
import TeamSection from '../components/TeamSection';
import Footer from '../components/Footer';
import FooterNew from '../components/FooterNew';

export default function LandingPage() {
  const whyRef = useRef(null);
  const howRef = useRef(null);
  const teamRef = useRef(null);

  const scrollToSection = (ref) => {
    window.scrollTo({
      top: ref.current.offsetTop - 80,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-offwhite">
      <NavBar 
        scrollToWhy={() => scrollToSection(whyRef)} 
        scrollToHow={() => scrollToSection(howRef)} 
        scrollToTeam={() => scrollToSection(teamRef)} 
      />
      <HeroSection scrollToHow={() => scrollToSection(howRef)} />
      <div ref={whyRef}><WhySection /></div>
      <div ref={howRef}><HowItWorks /></div>
      <div ref={teamRef}><TeamSection /></div>
      <FooterNew />
    </div>
  );
}