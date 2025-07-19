import React, { useRef } from 'react';
import Navbar, { ThemeProvider, useTheme } from '../components/NavBar';
import HeroSection from '../components/HeroSection';
import WhySection from '../components/WhySection';
import HowItWorks from '../components/HowItWorks';
import TeamSection from '../components/TeamSection';
import Footer from '../components/FooterNew';
import About from '../components/About';
import KeyFeature from '../components/KeyFeature';

function LandingPageContent() {
  const { isDarkMode } = useTheme();
  const heroRef = useRef(null);
  const aboutRef = useRef(null);
  const featuresRef = useRef(null);
  const howRef = useRef(null);
  const problemRef = useRef(null);
  const teamRef = useRef(null);

  const scrollToSection = (ref) => {
    window.scrollTo({
      top: ref.current.offsetTop - 80,
      behavior: 'smooth'
    });
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <Navbar 
        scrollToHero={() => scrollToSection(heroRef)}
        scrollToAbout={() => scrollToSection(aboutRef)}
        scrollToFeatures={() => scrollToSection(featuresRef)} 
        scrollToProblem={() => scrollToSection(problemRef)}
        scrollToTeam={() => scrollToSection(teamRef)} 
      />
      <div ref={heroRef}><HeroSection scrollToHow={() => scrollToSection(howRef)} /></div>
      <div ref={aboutRef}><About scrollToAbout={() => scrollToSection(aboutRef)} /></div>
      <div ref={featuresRef}><KeyFeature scrollToFeatures={() => scrollToSection(featuresRef)} /></div>
      <div ref={problemRef}><WhySection scrollToProblem={() => scrollToSection(problemRef)}/></div>
      <div ref={teamRef}><TeamSection scrollToTeam={() => scrollToSection(teamRef)} /></div>
      <Footer />
    </div>
  );
}

export default function LandingPage() {
  return (
    <ThemeProvider>
      <LandingPageContent />
    </ThemeProvider>
  );
}