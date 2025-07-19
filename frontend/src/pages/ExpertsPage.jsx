import React, { useState, useEffect } from 'react';
import { User, Mail, Briefcase, Calendar, Search, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import { expertAPI } from '../services/api';
import NavigationHeader from '../components/NavigationHeader';

const ExpertCard = ({ expert }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Expert Header */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {expert.name}
          </h3>
          <p className="text-blue-600 dark:text-blue-400 font-medium">
            @{expert.username}
          </p>
        </div>
      </div>

      {/* Expert Details */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
          <Briefcase className="w-4 h-4" />
          <span className="text-sm">{expert.profession}</span>
        </div>

        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
          <Mail className="w-4 h-4" />
          <span className="text-sm">{expert.email}</span>
        </div>

        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">Joined {formatDate(expert.createdAt)}</span>
        </div>
      </div>

      {/* Expert Badge */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Verified Expert
          </span>
          <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors">
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
};

const ExpertsList = () => {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByProfession, setFilterByProfession] = useState('');

  // Fetch experts on component mount
  useEffect(() => {
    const fetchExperts = async () => {
      try {
        setLoading(true);
        const response = await expertAPI.getAllExperts();
        
        if (response.success) {
          setExperts(response.experts);
        } else {
          setError('Failed to fetch experts');
        }
      } catch (error) {
        console.error('Error fetching experts:', error);
        setError(error.message || 'Failed to fetch experts');
        toast.error('Failed to load experts');
      } finally {
        setLoading(false);
      }
    };

    fetchExperts();
  }, []);

  // Filter experts based on search term and profession
  const filteredExperts = experts.filter(expert => {
    const matchesSearch = expert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expert.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expert.profession.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProfession = filterByProfession === '' || 
                             expert.profession.toLowerCase().includes(filterByProfession.toLowerCase());
    
    return matchesSearch && matchesProfession;
  });

  // Get unique professions for filter dropdown
  const professions = [...new Set(experts.map(expert => expert.profession))];

  if (loading) {
    return (
      <>
      <NavigationHeader title="Expert Network" />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading experts...</p>
          </div>
        </div>
      </div>
      </>
      
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavigationHeader title="Expert Network" />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 text-red-500 mx-auto mb-4">
              <User className="w-full h-full" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Error Loading Experts
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <NavigationHeader title="Expert Network" />
      <div className="pt-16 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Expert Network
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Connect with verified news experts and professionals
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search experts by name, username, or profession..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Profession Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterByProfession}
                onChange={(e) => setFilterByProfession(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
              >
                <option value="">All Professions</option>
                {professions.map(profession => (
                  <option key={profession} value={profession}>
                    {profession}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredExperts.length} of {experts.length} experts
          </div>
        </div>
      </div>

      {/* Experts Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {filteredExperts.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || filterByProfession ? 'No experts found' : 'No experts available'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || filterByProfession 
                ? 'Try adjusting your search criteria.' 
                : 'Check back later for expert profiles.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperts.map((expert) => (
              <ExpertCard key={expert._id} expert={expert} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertsList;
