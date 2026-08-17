import { useRef, useEffect } from 'react';
import Navbar, { ThemeProvider, useTheme } from '../components/NavBar';
import HeroSection from '../components/HeroSection';
import WhySection from '../components/WhySection';
import TeamSection from '../components/TeamSection';
import Footer from '../components/FooterNew';
import About from '../components/About';
import KeyFeature from '../components/KeyFeature';

function LandingPageContent() {
  const { isDarkMode } = useTheme();
  const scrollRef = useRef(null);
  const heroRef = useRef(null);
  const aboutRef = useRef(null);
  const featuresRef = useRef(null);
  const howRef = useRef(null);
  const problemRef = useRef(null);
  const teamRef = useRef(null);

  // Custom scroll animation - Bidirectional and continuous
  useEffect(() => {
    const observerOptions = {
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      rootMargin: '0px 0px -10% 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target;
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Calculate visibility percentage
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(windowHeight, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const elementHeight = rect.height;
        const visibilityRatio = visibleHeight / elementHeight;
        
        // Apply animation based on visibility and scroll direction - More Responsive
        if (entry.isIntersecting && visibilityRatio > 0.05) {
          element.classList.add('animate-in');
          // Add stronger animation when fully visible - Lower Threshold
          if (visibilityRatio > 0.4) {
            element.classList.add('fully-visible');
          } else {
            element.classList.remove('fully-visible');
          }
        } else {
          // Remove animation when out of view - allows re-triggering
          element.classList.remove('animate-in');
          element.classList.remove('fully-visible');
        }
      });
    }, observerOptions);

    // Observe all elements with data-scroll attribute
    const scrollElements = document.querySelectorAll('[data-scroll]');
    scrollElements.forEach((el) => observer.observe(el));

    return () => {
      scrollElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // Enhanced parallax effect - Continuous and bidirectional
  useEffect(() => {
    let ticking = false;
    let lastScrollY = 0;

    const updateParallax = () => {
      const scrolled = window.pageYOffset;
      const scrollDirection = scrolled > lastScrollY ? 'down' : 'up';
      
      // Add scroll direction class to body for CSS targeting
      document.body.classList.remove('scroll-up', 'scroll-down');
      document.body.classList.add(`scroll-${scrollDirection}`);
      
      const parallaxElements = document.querySelectorAll('[data-scroll-speed]');
      
      parallaxElements.forEach((element) => {
        const speed = parseFloat(element.getAttribute('data-scroll-speed')) || 1;
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Check if element is in viewport
        const isInViewport = rect.top < windowHeight && rect.bottom > 0;
        
        if (isInViewport) {
          // More dynamic parallax based on element position in viewport
          const elementCenter = rect.top + rect.height / 2;
          const screenCenter = windowHeight / 2;
          const distanceFromCenter = (elementCenter - screenCenter) / screenCenter;
          
          // Enhanced parallax calculation - More Prominent Text Movement
          const parallaxOffset = scrolled * speed * 0.12;
          const dynamicOffset = distanceFromCenter * speed * 0.08;
          const finalOffset = -(parallaxOffset + dynamicOffset);
          
          // Apply transform with smooth transition
          element.style.transform = `translateY(${finalOffset}px)`;
          element.style.willChange = 'transform';
        } else {
          // Reset transform when out of view to prevent accumulation
          element.style.transform = 'translateY(0px)';
        }
      });
      
      lastScrollY = scrolled;
      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    // Initial call
    updateParallax();
    
    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', updateParallax, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', requestTick);
      window.removeEventListener('resize', updateParallax);
      // Clean up body classes
      document.body.classList.remove('scroll-up', 'scroll-down');
    };
  }, []);

  // Add glow effect CSS and locomotive scroll styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .glow-effect {
        position: relative;
      }
      
      .glow-effect::before {
        content: '';
        position: absolute;
        pointer-events: none;
        z-index: -1;
        top: 50%;
        left: 50%;
        width: 800px;
        height: 600px;
        background: radial-gradient(circle, rgba(56, 189, 248, 0.1), transparent 60%);
        transform: translate(-50%, -50%);
        animation: pulse 8s infinite ease-in-out;
      }
      
      .glow-effect-button {
        position: relative;
      }
      
      .glow-effect-button::before {
        content: '';
        position: absolute;
        pointer-events: none;
        z-index: -1;
        top: 50%;
        left: 50%;
        width: 200px;
        height: 100px;
        background: radial-gradient(circle, rgba(56, 189, 248, 0.15), transparent 60%);
        transform: translate(-50%, -50%);
        animation: pulse-button 6s infinite ease-in-out;
      }
      
      .glow-effect-text {
        position: relative;
        display: inline-block;
      }
      
      .glow-effect-text::before {
        content: '';
        position: absolute;
        pointer-events: none;
        z-index: -1;
        top: 50%;
        left: 50%;
        width: 120px;
        height: 80px;
        background: radial-gradient(circle, rgba(16, 185, 129, 0.12), transparent 60%);
        transform: translate(-50%, -50%);
        animation: pulse-text 7s infinite ease-in-out;
      }
      
      .glow-effect-nav {
        position: relative;
      }
      
      .glow-effect-nav::before {
        content: '';
        position: absolute;
        pointer-events: none;
        z-index: -1;
        top: 50%;
        left: 50%;
        width: 150px;
        height: 60px;
        background: radial-gradient(circle, rgba(56, 189, 248, 0.08), transparent 60%);
        transform: translate(-50%, -50%);
        opacity: 0;
        animation: pulse-nav 5s infinite ease-in-out;
      }
      
      .glow-effect-nav:hover::before {
        opacity: 1;
      }
      
      @keyframes pulse {
        0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.7; }
        50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.7; }
      }
      
      @keyframes pulse-button {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
        100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
      }
      
      @keyframes pulse-text {
        0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.4; }
        50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.7; }
        100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.4; }
      }
      
      @keyframes pulse-nav {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.6; }
        100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
      }

      /* Enhanced Custom Scroll Animation Styles - Prominent Movement */
      [data-scroll] {
        opacity: 0;
        transform: translateY(80px) scale(0.95);
        transition: all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        will-change: transform, opacity;
      }
      
      [data-scroll].animate-in {
        opacity: 1;
        transform: translateY(0) scale(1) !important;
      }

      [data-scroll].fully-visible {
        opacity: 1;
        transform: translateY(-5px) scale(1.02) !important;
        transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
      }

      /* Staggered animation delays for different speeds */
      [data-scroll-speed="1"] {
        transition-delay: 0.1s;
      }
      
      [data-scroll-speed="1.5"] {
        transition-delay: 0.15s;
      }
      
      [data-scroll-speed="2"] {
        transition-delay: 0.2s;
        transform: translateY(100px) scale(0.93);
      }
      
      [data-scroll-speed="2"].animate-in {
        transform: translateY(0) scale(1) !important;
      }

      [data-scroll-speed="2"].fully-visible {
        transform: translateY(-8px) scale(1.03) !important;
      }
      
      [data-scroll-speed="3"] {
        transition-delay: 0.3s;
        transform: translateY(120px) scale(0.91);
      }
      
      [data-scroll-speed="3"].animate-in {
        transform: translateY(0) scale(1) !important;
      }

      [data-scroll-speed="3"].fully-visible {
        transform: translateY(-10px) scale(1.04) !important;
      }
      
      [data-scroll-speed="4"] {
        transition-delay: 0.4s;
        transform: translateY(140px) scale(0.89);
      }
      
      [data-scroll-speed="4"].animate-in {
        transform: translateY(0) scale(1) !important;
      }

      [data-scroll-speed="4"].fully-visible {
        transform: translateY(-12px) scale(1.05) !important;
      }
      
      [data-scroll-speed="5"] {
        transition-delay: 0.5s;
        transform: translateY(160px) scale(0.87);
      }
      
      [data-scroll-speed="5"].animate-in {
        transform: translateY(0) scale(1) !important;
      }

      [data-scroll-speed="5"].fully-visible {
        transform: translateY(-15px) scale(1.06) !important;
      }

      /* Enhanced parallax and animation support */
      [data-scroll-speed] {
        will-change: transform, opacity;
        position: relative;
        z-index: 1;
        backface-visibility: hidden;
        perspective: 1000px;
      }

      /* Ensure sections don't overlap and support smooth animations */
      section {
        position: relative;
        z-index: 1;
        transform-style: preserve-3d;
      }

      /* Smooth scroll for navigation */
      html {
        scroll-behavior: smooth;
      }

      /* Animation state classes for better control */
      .scroll-up [data-scroll] {
        transition-duration: 0.8s;
      }
      
      .scroll-down [data-scroll] {
        transition-duration: 1s;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const scrollToSection = (ref) => {
    if (ref.current) {
      const yOffset = -80;
      const element = ref.current;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'bg-[#0D1117]' : 'bg-gray-50'
      }`}
    >
      <Navbar 
        scrollToHero={() => scrollToSection(heroRef)}
        scrollToAbout={() => scrollToSection(aboutRef)}
        scrollToFeatures={() => scrollToSection(featuresRef)} 
        scrollToProblem={() => scrollToSection(problemRef)}
        scrollToTeam={() => scrollToSection(teamRef)} 
      />
      <div ref={heroRef}>
        <HeroSection scrollToHow={() => scrollToSection(howRef)} scrollToTeam={() => scrollToSection(teamRef)} />
      </div>
      <div ref={aboutRef} data-tour="landing-about">
        <About scrollToAbout={() => scrollToSection(aboutRef)} />
      </div>
      <div ref={featuresRef} data-tour="landing-features">
        <KeyFeature scrollToFeatures={() => scrollToSection(featuresRef)} />
      </div>
      <div ref={problemRef} data-tour="landing-how-it-works">
        <WhySection scrollToProblem={() => scrollToSection(problemRef)}/>
      </div>
      <div ref={teamRef} data-tour="landing-team">
        <TeamSection scrollToTeam={() => scrollToSection(teamRef)} />
      </div>
      <div>
        <Footer scrollToTeam={() => scrollToSection(teamRef)}/>
      </div>
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