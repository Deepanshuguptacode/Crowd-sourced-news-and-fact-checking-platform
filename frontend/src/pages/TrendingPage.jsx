import React, { useState, useEffect, useContext } from 'react';
import { TrendingUp, RefreshCw, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import TrendingNewsCard from '../components/TrendingNewsCard';
import { trendingNewsService } from '../services/trendingNewsService';
import { UserContext } from '../context/userContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TrendingPage = () => {
  const { userInfo: user, isAuthenticated } = useContext(UserContext);
  const [trendingNews, setTrendingNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [activeTab, setActiveTab] = useState('trending'); // trending, reposts

  const itemsPerPage = 12;

  // Fetch trending news
  const fetchTrendingNews = async (page = 1) => {
    try {
      setLoading(page === 1);
      const response = await trendingNewsService.getTrendingNews(page, itemsPerPage);
      
      if (response.success) {
        setTrendingNews(response.data);
        setPagination(response.pagination);
      } else {
        toast.error('Failed to fetch trending news');
      }
    } catch (error) {
      console.error('Error fetching trending news:', error);
      toast.error(error.message || 'Failed to fetch trending news');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user reposts
  const fetchUserReposts = async (page = 1) => {
    try {
      setLoading(page === 1);
      const response = await trendingNewsService.getUserReposts(page, itemsPerPage);
      
      if (response.success) {
        setTrendingNews(response.data);
        setPagination(response.pagination);
      } else {
        toast.error('Failed to fetch your reposts');
      }
    } catch (error) {
      console.error('Error fetching user reposts:', error);
      toast.error(error.message || 'Failed to fetch your reposts');
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh news
  const handleManualRefresh = async () => {
    if (!user) {
      toast.error('Please login to refresh news');
      return;
    }

    setRefreshing(true);
    try {
      const response = await trendingNewsService.fetchTrendingNews();
      if (response.success) {
        toast.success(`News updated: ${response.newCount} new, ${response.updatedCount} updated`);
        fetchTrendingNews(1);
      } else {
        toast.error(response.message || 'Failed to refresh news');
      }
    } catch (error) {
      console.error('Error refreshing news:', error);
      toast.error(error.message || 'Failed to refresh news');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (activeTab === 'trending') {
      fetchTrendingNews(newPage);
    } else {
      fetchUserReposts(newPage);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    if (tab === 'trending') {
      fetchTrendingNews(1);
    } else {
      fetchUserReposts(1);
    }
  };

  // Filter news based on search
  const filteredNews = trendingNews.filter(news =>
    news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchTrendingNews(1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-700">
        <Header />
      </div>

      {/* Main Content */}
      <div className="pt-16 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-8 h-8 text-orange-500" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Trending News
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Latest news from trusted sources, updated every 10 minutes
                  </p>
                </div>
              </div>

              {/* Manual Refresh Button */}
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh News'}</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => handleTabChange('trending')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'trending'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Trending News
              </button>
              {user && (
                <button
                  onClick={() => handleTabChange('reposts')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'reposts'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  My Reposts
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search news..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600 dark:text-gray-400">Loading trending news...</span>
              </div>
            </div>
          )}

          {/* News Grid */}
          {!loading && (
            <>
              {filteredNews.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    {activeTab === 'trending' ? 'No trending news found' : 'No reposts found'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm
                      ? 'Try adjusting your search terms'
                      : activeTab === 'trending'
                      ? 'Check back later for the latest updates'
                      : 'Start reposting news to see them here'
                    }
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {filteredNews.map((news) => (
                      <TrendingNewsCard
                        key={news._id}
                        news={news}
                        currentUser={user}
                        onRepost={() => {
                          if (activeTab === 'trending') {
                            fetchTrendingNews(currentPage);
                          } else {
                            fetchUserReposts(currentPage);
                          }
                        }}
                        showRepostButton={activeTab === 'trending'}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="flex items-center space-x-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>

                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, currentPage - 2) + i;
                          if (pageNum > pagination.totalPages) return null;
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-2 text-sm font-medium rounded-md ${
                                pageNum === currentPage
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="flex items-center space-x-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 w-full z-50 backdrop-blur-md bg-white/95 dark:bg-gray-900/95 border-t border-gray-200 dark:border-gray-700">
        <Footer />
      </div>
    </div>
  );
};

export default TrendingPage;
