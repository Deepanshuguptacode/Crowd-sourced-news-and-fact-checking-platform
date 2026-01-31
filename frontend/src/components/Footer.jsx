import React from 'react'
import logoTransparent from '../assets/logo-transparent.png';

const Footer = () => {
  const links = [{ href: '/about', label: 'About' }, { href: '/privacy', label: 'Privacy' }, { href: '/terms', label: 'Terms' }, { href: '/contact', label: 'Contact' }];

  return (
    <footer className="w-full bg-white/95 dark:bg-[#0D1117] backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <img src={logoTransparent} alt="Logo" className="w-10 h-10 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">© {new Date().getFullYear()} VoxVeritas. All rights reserved.</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Empowering truth through community verification</p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-sm">
            {links.map(link => (
              <a key={link.href} href={link.href} className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{link.label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer;
