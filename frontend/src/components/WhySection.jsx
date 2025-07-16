import React from 'react';

export default function WhySection() {
  return (
    <section className="py-16 bg-offwhite">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-charcoal">
          Why We Built TruthCheck
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-gold">
            <h3 className="text-2xl font-bold mb-4 text-teal">The Problem</h3>
            <p className="mb-4 text-charcoal">
              Misinformation spreads 6x faster than real news, undermining trust in institutions.
            </p>
            <ul className="space-y-3 text-charcoal">
              <li className="flex items-start">
                <span className="text-gold mr-2 font-bold">•</span>
                <span>Fake news reaches people 6x faster than truth (MIT Study)</span>
              </li>
              <li className="flex items-start">
                <span className="text-gold mr-2 font-bold">•</span>
                <span>62% of internet users get news from social media</span>
              </li>
              <li className="flex items-start">
                <span className="text-gold mr-2 font-bold">•</span>
                <span>Only 26% of adults can identify fake news consistently</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-teal">
            <h3 className="text-2xl font-bold mb-4 text-teal">Our Solution</h3>
            <p className="mb-4 text-charcoal">
              A decentralized platform combining crowd wisdom with expert verification.
            </p>
            <ul className="space-y-3 text-charcoal">
              <li className="flex items-start">
                <span className="text-gold mr-2 font-bold">•</span>
                <span>Community-powered fact-checking</span>
              </li>
              <li className="flex items-start">
                <span className="text-gold mr-2 font-bold">•</span>
                <span>Journalist and expert verification</span>
              </li>
              <li className="flex items-start">
                <span className="text-gold mr-2 font-bold">•</span>
                <span>AI-assisted detection of misinformation</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}