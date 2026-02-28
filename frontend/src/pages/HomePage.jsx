import React, { useState } from 'react'
import NewsFeed from '../components/NewsFeed'
import RightBar from '../components/RightBar'
import Header from '../components/Header'
import Footer from '../components/Footer'

const HomePage = () => {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="min-h-screen bg-white dark:bg-[#0D1117] transition-all duration-500">
      <div className="fixed top-0 w-full z-50 backdrop-blur-md bg-white dark:bg-[#0D1117]/95">
        <Header onMenuToggle={() => setShowMenu(!showMenu)} />
      </div>
      
      {showMenu && (
        <>
          <div className="fixed top-16 inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300" onClick={() => setShowMenu(false)} />
          <div className="fixed top-16 left-0 bottom-0 w-80 bg-white dark:bg-[#0D1117] z-50 lg:hidden border-r border-gray-200 dark:border-gray-600 transform transition-transform duration-300 p-6 overflow-auto">
            <RightBar />
          </div>
        </>
      )}

      <div className="pt-16 pb-16">
        <div className="max-w-7xl mx-auto flex min-h-screen">
          <div className="hidden lg:block w-80 fixed left-[max(0px,calc((100%-80rem)/2))] top-16 h-screen bg-white dark:bg-[#0D1117] border-r border-gray-200 dark:border-gray-600 shadow-lg z-40 overflow-y-scroll scrollbar-hide px-6 py-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <RightBar />
          </div>

          <div className="flex-1 lg:ml-80 min-h-screen px-6 py-6">
            <NewsFeed />
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-20 right-4 z-50">
        <button data-tour="home-menu-toggle" onClick={() => setShowMenu(!showMenu)} className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group">
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      <div className="fixed bottom-0 left-0 w-full z-50 backdrop-blur-md bg-white/95 dark:bg-[#0D1117]/95 border-t border-gray-200 dark:border-gray-600">
        <Footer />
      </div>
    </div>
  )
}

export default HomePage
