import React from 'react';
import { FaEnvelope, FaLinkedin, FaGithub, FaBookOpen, FaAward, FaExternalLinkAlt } from 'react-icons/fa';
import { useTheme } from './NavBar';
import deepanshuImg from '../assets/deepanshu.jpg';

const RESEARCH_PAPER_URL =
  'https://onedrive.live.com/?id=%2Fpersonal%2Fa98ec36420258513%2FDocuments%2FReasearchPaper%2FVoxVeritas%5FRSP%208%20page%2Epdf&listurl=%2Fpersonal%2Fa98ec36420258513%2FDocuments&ithint=file%2Cpdf&e=RWEvpG&migratedtospo=true&parent=%2Fpersonal%2Fa98ec36420258513%2FDocuments%2FReasearchPaper&redeem=aHR0cHM6Ly8xZHJ2Lm1zL2IvYy9hOThlYzM2NDIwMjU4NTEzL0lRQTV4VmI4clRpMFE2NXZFb2RHR09abUFmd29yY1I2RWQ5eFk3VGRocmdZbzhzP2U9UldFdnBH&ga=1';
const IEEE_URL = 'https://ieeexplore.ieee.org/document/11565047';

export default function TeamSection() {
  const { isDarkMode } = useTheme();

  return (
    <section
      className={`py-20 transition-colors duration-300 ${
        isDarkMode ? 'bg-[#0D1117]' : 'bg-white'
      }`}
    >
      <div className="container mx-auto px-4">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2
            className={`text-3xl md:text-4xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-[#C9D1D9]' : 'text-gray-900'
            }`}
            data-scroll
            data-scroll-speed="2"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            The Developer Behind the Platform
          </h2>
          <p
            className={`text-sm tracking-widest uppercase font-semibold ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Who Shipped This?
          </p>
        </div>

        {/* Single Centered Card */}
        <div className="flex justify-center">
          <div
            className={`p-1 rounded-2xl shadow-2xl hover:shadow-sky-500/30 transition-all group border max-w-sm w-full ${
              isDarkMode
                ? 'bg-[#0D1117] border-gray-700 hover:border-sky-500/50'
                : 'bg-white border-gray-200 hover:border-sky-500/50'
            }`}
            data-scroll
            data-scroll-speed="2"
          >
            <div className="bg-gradient-to-r from-sky-500 to-emerald-500 p-[2px] rounded-2xl">
              <div
                className={`rounded-xl p-8 text-center flex flex-col items-center ${
                  isDarkMode ? 'bg-[#0D1117]' : 'bg-white'
                }`}
              >
                {/* Avatar */}
                <div className="w-40 h-40 mb-6 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 p-[3px] flex-shrink-0">
                  <img
                    src={deepanshuImg}
                    alt="Deepanshu Gupta"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>

                {/* Name & Role */}
                <h3
                  className={`text-2xl font-bold mb-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-[#C9D1D9]' : 'text-gray-900'
                  }`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Deepanshu Gupta
                </h3>
                <p
                  className="text-sm mb-2 font-semibold bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Backend &amp; Gen-AI Engineer
                </p>


                {/* IEEE Research Badge */}
                <div
                  className={`w-full mb-6 rounded-xl p-4 border ${
                    isDarkMode
                      ? 'bg-[#161B22] border-sky-800/60'
                      : 'bg-sky-50 border-sky-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FaAward className="text-yellow-400 text-lg flex-shrink-0" />
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isDarkMode ? 'text-sky-400' : 'text-sky-600'
                      }`}
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      IEEE Published Research
                    </span>
                  </div>
                  <p
                    className={`text-xs leading-relaxed mb-3 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    VoxVeritas: Hybrid Crowd-AI Platform for Scalable Verification
                    of Misinformation with Privacy-Preserving Biometric
                    Authentication and Structured Debate
                  </p>
                  <div className="flex justify-center gap-3 flex-wrap">
                    <a
                      href={IEEE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:from-sky-600 hover:to-blue-700 transition-all"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      IEEE Xplore
                      <FaExternalLinkAlt className="text-[10px]" />
                    </a>
                    <a
                      href={RESEARCH_PAPER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        isDarkMode
                          ? 'border-sky-700 text-sky-400 hover:bg-sky-900/30'
                          : 'border-sky-400 text-sky-600 hover:bg-sky-50'
                      }`}
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      <FaBookOpen className="text-sm" />
                      Read Paper
                      <FaExternalLinkAlt className="text-[10px]" />
                    </a>
                  </div>
                </div>

                {/* Social Links — revealed on hover */}
                <div className="flex justify-center space-x-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <a
                    href="mailto:deepanshugupta650@gmail.com"
                    title="Email"
                    className="text-sky-500 hover:text-sky-400 transition-colors text-lg"
                  >
                    <FaEnvelope />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/deepanshu-gupta-650d/"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="LinkedIn"
                    className="text-sky-500 hover:text-sky-400 transition-colors text-lg"
                  >
                    <FaLinkedin />
                  </a>
                  <a
                    href="https://github.com/Deepanshuguptacode"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="GitHub"
                    className="text-sky-500 hover:text-sky-400 transition-colors text-lg"
                  >
                    <FaGithub />
                  </a>
                  <a
                    href="https://drive.google.com/file/d/1T_CWeY01TxoX_3c_YhocNFXNDCF0Wysu/view?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Resume"
                    className="text-sky-500 hover:text-sky-400 transition-colors text-lg"
                  >
                    <FaBookOpen />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}