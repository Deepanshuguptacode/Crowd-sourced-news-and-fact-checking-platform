import React, { useState } from 'react'
import NewsFeed from '../components/NewsFeed'
import RightBar from '../components/RightBar'
import Header from '../components/Header'
import Footer from '../components/Footer'

const HomePage = () => {
  const [showMenu, setShowMenu] = useState(false)
  const [activeTab, setActiveTab] = useState('trending')

  return (
    <div className="min-h-screen bg-white dark:bg-[#0D1117] transition-all duration-500">
      {/* Enhanced Header with backdrop blur */}
      <div className="fixed top-0 w-full z-50 backdrop-blur-md bg-white dark:bg-[#0D1117]/95 ">
        <Header onMenuToggle={() => setShowMenu(!showMenu)} />
      </div>
      {/* Enhanced Mobile menu overlay */}
      {showMenu && (
        <>
          <div
            className="fixed top-16 inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
            onClick={() => setShowMenu(false)}
          />
          <div className="fixed top-16 left-0 bottom-0 w-80 bg-white dark:bg-[#0D1117] z-50 lg:hidden border-r border-gray-200 dark:border-gray-600 transform transition-transform duration-300">
            <div className="p-6 h-full overflow-auto">
              <RightBar />
            </div>
          </div>
        </>
      )}

      {/* Main Content Area - 2 Column Layout */}
      <div className="pt-16 pb-16">
        <div className="flex min-h-screen">
          {/* Column 1: Fixed Left Sidebar - RightBar (Quick Actions) */}
          <div className="hidden lg:block w-80 fixed left-0 top-16 h-screen bg-white dark:bg-[#0D1117] border-r border-gray-200 dark:border-gray-600 shadow-lg z-40">
            <div className="h-full overflow-y-scroll scrollbar-hide px-6 py-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Quick Actions
                  </h3>
                  <RightBar />
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Main Content - NewsFeed (Full Width) */}
          <div className="flex-1 lg:ml-80">
            <div className="min-h-screen">
              <div className="px-6 py-6">
                {/* News Feed Container */}
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                  <NewsFeed />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Action Button for Mobile - Quick Actions */}
      <div className="lg:hidden fixed bottom-20 right-4 z-50">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
        >
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      {/* Enhanced Footer */}
      <div className="fixed bottom-0 left-0 w-full z-50 backdrop-blur-md bg-white/95 dark:bg-[#0D1117]/95 border-t border-gray-200 dark:border-gray-600">
        <Footer />
      </div>
    </div>
  )
}

export default HomePage
