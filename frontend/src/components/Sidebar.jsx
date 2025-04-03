import React from 'react'

const Sidebar = () => {
  return (
    <aside className="w-full max-w-full bg-white p-5 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-3">Trending News</h2>
      <ul className="space-y-2">
        <li className="text-gray-700">🚀 AI Reaches New Heights</li>
        <li className="text-gray-700">🌍 Climate Change Policy Updated</li>
        <li className="text-gray-700">📈 Stock Market Hits Record High</li>
      </ul>

      <h2 className="text-lg font-semibold mt-4 mb-3">Top Contributors</h2>
      <ul className="space-y-2">
        <li className="text-gray-700">Expert: Dr. Jane Doe</li>
        <li className="text-gray-700">Community: User123</li>
      </ul>
    </aside>
  )
}

export default Sidebar;
