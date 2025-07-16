import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationHeader from '../components/NavigationHeader';
import { 
  User, 
  Mail, 
  MapPin, 
  Calendar, 
  Edit3, 
  Shield, 
  Award, 
  TrendingUp,
  FileText,
  Users,
  Star,
  CheckCircle,
  Camera
} from 'lucide-react';

const UserProfile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "John Doe",
    username: "johndoe_verified",
    email: "john.doe@example.com",
    bio: "Community fact-checker passionate about fighting misinformation. Journalism background with 5+ years of experience in digital media verification.",
    location: "New York, USA",
    joinDate: "January 2023",
    userType: "Expert User",
    profilePicture: null, // We'll use initials for now
    stats: {
      articlesSubmitted: 47,
      factChecksContributed: 156,
      reputationScore: 892,
      followers: 324,
      following: 89
    },
    badges: [
      { name: "Fact-Check Master", icon: "Shield", color: "blue" },
      { name: "Community Hero", icon: "Award", color: "purple" },
      { name: "Truth Seeker", icon: "Star", color: "yellow" }
    ],
    expertise: ["Politics", "Technology", "Health", "Science"]
  });

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
    console.log("Saving profile data:", profileData);
  };

  const StatCard = ({ icon: Icon, label, value, color = "blue" }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200">
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 bg-${color}-500/20 rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-sm text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );

  const BadgeComponent = ({ badge }) => {
    const iconMap = {
      Shield: Shield,
      Award: Award,
      Star: Star
    };
    const Icon = iconMap[badge.icon] || Shield;

    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-2 bg-${badge.color}-500/20 text-${badge.color}-400 rounded-lg border border-${badge.color}-500/30`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{badge.name}</span>
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen bg-slate-900 relative overflow-x-hidden stage-1-background"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #3b82f6 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, #8b5cf6 0%, transparent 50%)`
        }}></div>
      </div>

      {/* Navigation Header */}
      <NavigationHeader title="User Profile" />

      {/* Main Content */}
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-16 relative z-10 mt-16 stage-3-form">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          
          {/* Top Section - Left and Right Containers */}
          <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch">
            
            {/* Left Container - Profile Picture and Quick Stats */}
            <div className="lg:w-2/5 flex">
              <div className="bg-slate-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-slate-700/50 p-6 sticky top-24 w-full">
                {/* Profile Picture */}
                <div className="text-center mb-4">
                  <div className="relative inline-block">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-4xl">
                        {profileData.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <button className="absolute bottom-2 right-2 w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center border-2 border-slate-600 transition-colors">
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                {/* User Type Badge */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{profileData.userType}</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Reputation</span>
                    <span className="text-white font-semibold">{profileData.stats.reputationScore}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Articles</span>
                    <span className="text-white font-semibold">{profileData.stats.articlesSubmitted}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Fact-Checks</span>
                    <span className="text-white font-semibold">{profileData.stats.factChecksContributed}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Following</span>
                    <span className="text-white font-semibold">{profileData.stats.following}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Followers</span>
                    <span className="text-white font-semibold">{profileData.stats.followers}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Container - Basic Editable Information */}
            <div className="lg:w-3/5 flex">
              <div className="bg-slate-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-slate-700/50 p-6 w-full">
                {/* Header with Edit Button */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{profileData.name}</h1>
                    <p className="text-slate-400">@{profileData.username}</p>
                  </div>
                  <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(!isEditing)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
                  </button>
                </div>

                {/* Basic Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 px-4 py-3 bg-slate-700/30 rounded-xl">
                        <User className="w-5 h-5 text-slate-400" />
                        <span className="text-white">{profileData.name}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 px-4 py-3 bg-slate-700/30 rounded-xl">
                        <Mail className="w-5 h-5 text-slate-400" />
                        <span className="text-white">{profileData.email}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Location</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 px-4 py-3 bg-slate-700/30 rounded-xl">
                        <MapPin className="w-5 h-5 text-slate-400" />
                        <span className="text-white">{profileData.location}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Member Since</label>
                    <div className="flex items-center space-x-2 px-4 py-3 bg-slate-700/30 rounded-xl">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <span className="text-white">{profileData.joinDate}</span>
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                <div className="mt-6">
                  <label className="block text-slate-300 text-sm font-medium mb-2">Bio</label>
                  {isEditing ? (
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows="4"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-700/30 rounded-xl">
                      <p className="text-white leading-relaxed">{profileData.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Full Width Information */}
          <div className="space-y-6">
            {/* Statistics Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                icon={FileText} 
                label="Articles Submitted" 
                value={profileData.stats.articlesSubmitted}
                color="blue"
              />
              <StatCard 
                icon={Shield} 
                label="Fact-Checks" 
                value={profileData.stats.factChecksContributed}
                color="green"
              />
              <StatCard 
                icon={TrendingUp} 
                label="Reputation Score" 
                value={profileData.stats.reputationScore}
                color="purple"
              />
              <StatCard 
                icon={Users} 
                label="Followers" 
                value={profileData.stats.followers}
                color="indigo"
              />
            </div>

            {/* Badges and Achievements */}
            <div className="bg-slate-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-slate-700/50 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Badges & Achievements</h3>
              <div className="flex flex-wrap gap-3">
                {profileData.badges.map((badge, index) => (
                  <BadgeComponent key={index} badge={badge} />
                ))}
              </div>
            </div>

            {/* Areas of Expertise */}
            <div className="bg-slate-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-slate-700/50 p-6 stage-4-details">
              <h3 className="text-xl font-bold text-white mb-4">Areas of Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {profileData.expertise.map((area, index) => (
                  <span 
                    key={index}
                    className="px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg text-sm border border-slate-600/50"
                  >
                    {area}
                  </span>
                ))}
                {isEditing && (
                  <button className="px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg text-sm border border-blue-600/30 hover:bg-blue-600/30 transition-colors">
                    + Add Expertise
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
