import React from 'react'

const Sidebar = () => {
  const trendingNews = [
    { title: "AI Reaches New Heights in Medical Diagnosis", verified: true, votes: 1250 },
    { title: "Climate Change Policy Gets Global Support", verified: true, votes: 980 },
    { title: "Cryptocurrency Market Shows Recovery", verified: false, votes: 750 },
    { title: "Space Mission Achieves Historic Milestone", verified: true, votes: 1100 },
  ];

  const topContributors = [
    { name: "Dr. Sarah Chen", type: "Expert", contributions: 89, specialty: "Health & Science" },
    { name: "Alex Johnson", type: "Community", contributions: 156, specialty: "Technology" },
    { name: "Prof. Mike Wilson", type: "Expert", contributions: 67, specialty: "Climate" },
    { name: "Emma Davis", type: "Community", contributions: 134, specialty: "Politics" },
  ];

  const VerifiedIcon = () => (
    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const PendingIcon = () => (
    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const ExpertIcon = () => (
    <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 14l9-5-9-5-9 5 9 5z" />
      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  );

  const CommunityIcon = () => (
    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  );

  return (
    <div className="w-full space-y-6">
      {/* Top Contributors Section */}
      <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Top Contributors
        </h3>
        
        <div className="space-y-3">
          {topContributors.map((contributor, index) => (
            <div key={index} className="group cursor-pointer">
              <div className="flex items-center space-x-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded px-2 -mx-2">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {contributor.name.charAt(0)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    {contributor.type === 'Expert' ? <ExpertIcon /> : <CommunityIcon />}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {contributor.name}
                    </p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      contributor.type === 'Expert' 
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' 
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {contributor.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {contributor.specialty} • {contributor.contributions} contributions
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="pt-2">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Platform Health</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center py-2">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">24/7</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Monitoring</div>
          </div>
          <div className="text-center py-2">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">99.9%</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Uptime</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
