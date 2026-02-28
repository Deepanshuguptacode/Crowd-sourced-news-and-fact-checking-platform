import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../context/userContext'
import { toast } from 'react-toastify'
import AnimatedLogo from './AnimatedLogo'
import TourButton from './TourButton'

const Icon = ({ path, size = "w-5 h-5", filled = false }) => (
  <svg className={size} fill={filled ? "currentColor" : "none"} stroke={filled ? "none" : "currentColor"} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
)

const SearchInput = ({ value, onChange, autoFocus }) => (
  <div className="relative">
    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
      <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </div>
    <input
      type="text"
      placeholder="Search news, topics, experts..."
      value={value}
      onChange={onChange}
      autoFocus={autoFocus}
      className="pl-10 pr-4 py-2.5 w-full bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
    />
  </div>
)

const Header = ({ onMenuToggle }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  const { userType, userInfo, isAuthenticated, logout } = useContext(UserContext)
  const navigate = useNavigate()

  const handleLogout = () => {
    setShowUserMenu(false)
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])

  const navItems = [
    { label: 'Home', path: '/home', active: true },
    { label: 'Trending', path: '/trending' },
    { label: 'Experts', path: '/experts' },
    { label: 'Submit', path: '/submit-news' }
  ]

  const userTypeLabels = { normal: 'Onlooker', community: 'Community Member', expert: 'Expert', guest: 'Guest Explorer' }

  return (
    <header data-tour="home-header" className="w-full bg-white dark:bg-[#0D1117] backdrop-blur-lg text-gray-800 dark:text-white shadow-lg transition-all duration-300">
      <div className="border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-2">
          <div className="flex justify-between items-center h-16 gap-4">
            <div className="flex items-center space-x-12">
              <button onClick={onMenuToggle} className="text-2xl lg:hidden focus:outline-none p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">☰</button>
              <AnimatedLogo size="w-10 h-10" brandName="VoxVeritas" showBrand={true} />
              <nav className="hidden md:flex items-center space-x-3">
                {navItems.map(item => (
                  <button key={item.label} onClick={() => navigate(item.path)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${item.active ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden md:block w-80">
                <SearchInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>

              <button onClick={() => setShowSearch(!showSearch)} className="md:hidden p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none transition-colors" aria-label="Search">
                <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </button>

              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none transition-colors" aria-label="Toggle dark mode">
                <Icon path={theme === 'dark' ? "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" : "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"} />
              </button>

              <TourButton />

              <div className="flex items-center space-x-3 relative user-menu-container">
                {isAuthenticated ? (
                  <>
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{userInfo?.name || userInfo?.username || 'User'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{userTypeLabels[userType] || 'User'}</p>
                    </div>
                    <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 hover:from-blue-600 hover:to-purple-700 transition-all duration-200">
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </div>
                    </button>
                    
                    {showUserMenu && (
                      <div className="absolute right-0 top-12 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{userInfo?.name || userInfo?.username}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{userInfo?.email}</p>
                        </div>
                        <button onClick={() => { setShowUserMenu(false); navigate('/profile'); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Profile Settings</button>
                        {['normal', 'community', 'expert'].includes(userType) && (
                          <button onClick={() => { setShowUserMenu(false); navigate('/submit-news'); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Submit News</button>
                        )}
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">Logout</button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">Login</button>
                    <button onClick={() => navigate('/signup')} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Sign Up</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSearch && (
        <div className="md:hidden border-t border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg px-4 py-3">
          <SearchInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
        </div>
      )}
    </header>
  )
}

export default Header
