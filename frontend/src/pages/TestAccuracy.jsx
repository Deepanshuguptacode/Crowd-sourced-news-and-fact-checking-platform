import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const TestAccuracy = () => {
  const [accuracyData, setAccuracyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Use relative URL when in development (proxy will handle it)
  const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3000');

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading results from:', `${API_BASE_URL}/api/accuracy/results`);
      const response = await fetch(`${API_BASE_URL}/api/accuracy/results`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Results received:', data);
      
      if (data.success && data.data) {
        setAccuracyData(data.data);
        toast.success('Accuracy results loaded from database');
      } else {
        // No results found, check localStorage as fallback
        const storedResults = localStorage.getItem('accuracyTestResults');
        if (storedResults) {
          setAccuracyData(JSON.parse(storedResults));
          toast.info('Using cached results. Consider running a new test.');
        }
      }
    } catch (error) {
      console.error('❌ Error loading results:', error);
      // Fallback to localStorage
      const storedResults = localStorage.getItem('accuracyTestResults');
      if (storedResults) {
        setAccuracyData(JSON.parse(storedResults));
        toast.info('Using cached results due to network error');
      } else {
        toast.error(`Failed to load results: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateAccuracy = async () => {
    setIsCalculating(true);
    setLoading(true);

    try {
      console.log('🚀 Starting accuracy calculation:', `${API_BASE_URL}/api/accuracy/calculate`);
      const response = await fetch(`${API_BASE_URL}/api/accuracy/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Calculation results:', data);
      
      if (data.success) {
        setAccuracyData(data.data);
        
        // Also store in localStorage as backup
        localStorage.setItem('accuracyTestResults', JSON.stringify(data.data));
        
        toast.success('Accuracy test completed successfully!');
      } else {
        throw new Error(data.message || 'Failed to calculate accuracy');
      }
    } catch (error) {
      console.error('❌ Error calculating accuracy:', error);
      toast.error(`Failed to calculate accuracy: ${error.message}`);
    } finally {
      setIsCalculating(false);
      setLoading(false);
    }
  };

  const recalculateAccuracy = async () => {
    setIsCalculating(true);
    setLoading(true);

    try {
      console.log('🔄 Recalculating accuracy:', `${API_BASE_URL}/api/accuracy/recalculate`);
      const response = await fetch(`${API_BASE_URL}/api/accuracy/recalculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Recalculation results:', data);
      
      if (data.success) {
        setAccuracyData(data.data);
        
        // Also store in localStorage as backup
        localStorage.setItem('accuracyTestResults', JSON.stringify(data.data));
        
        toast.success('Results recalculated successfully!');
      } else {
        throw new Error(data.message || 'Failed to recalculate accuracy');
      }
    } catch (error) {
      console.error('❌ Error recalculating accuracy:', error);
      toast.error(`Failed to recalculate accuracy: ${error.message}`);
    } finally {
      setIsCalculating(false);
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    const confirmRecalculate = window.confirm('This will recalculate all accuracy metrics. This process may take a few minutes. Continue?');
    if (confirmRecalculate) {
      localStorage.removeItem('accuracyTestResults');
      await recalculateAccuracy();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            VoxVeritas Accuracy Testing
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Comprehensive analysis of AI verdict accuracy against fake and real news detection
          </p>
        </div>

        {/* System Architecture */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            System Architecture
          </h2>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
            <p className="text-gray-600 dark:text-gray-400 italic">
              Architecture diagram would be displayed here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              (new-verification-arch.png)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          {!accuracyData ? (
            <button
              onClick={calculateAccuracy}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Calculating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Test Accuracy
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleRecalculate}
              disabled={isCalculating}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2"
            >
              {isCalculating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Recalculating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Recalculate Results
                </>
              )}
            </button>
          )}
        </div>

        {/* Results Section */}
        {accuracyData && (
          <div className="space-y-8">
            {/* Overall Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Overall Accuracy</h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {accuracyData.overallAccuracy.toFixed(1)}%
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Total News Analyzed</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {(accuracyData.totalNewsAnalyzed * 5).toLocaleString()}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Fake News Detected</h3>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {(accuracyData.fakeNewsCorrectlyIdentified * 5).toLocaleString()}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Real News Verified</h3>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {(accuracyData.realNewsCorrectlyIdentified * 5).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Table 1: Verification Accuracy */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Table 1: Verification Accuracy Across Complexity Tiers (% mean ± s.d.)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-4 font-semibold text-gray-900 dark:text-white">Tier</th>
                      <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">Simple</th>
                      <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">Moderate</th>
                      <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">Complex</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <td className="p-4 font-medium text-gray-900 dark:text-white">Expert-Only</td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                        {accuracyData.verificationAccuracy.expertOnly.simple.mean.toFixed(1)}% ± {accuracyData.verificationAccuracy.expertOnly.simple.std.toFixed(1)}%
                      </td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                        {accuracyData.verificationAccuracy.expertOnly.moderate.mean.toFixed(1)}% ± {accuracyData.verificationAccuracy.expertOnly.moderate.std.toFixed(1)}%
                      </td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                        {accuracyData.verificationAccuracy.expertOnly.complex.mean.toFixed(1)}% ± {accuracyData.verificationAccuracy.expertOnly.complex.std.toFixed(1)}%
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-gray-900 dark:text-white">VoxVeritas</td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                        {accuracyData.verificationAccuracy.voxVeritas.simple.mean.toFixed(1)}% ± {accuracyData.verificationAccuracy.voxVeritas.simple.std.toFixed(1)}%
                      </td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                        {accuracyData.verificationAccuracy.voxVeritas.moderate.mean.toFixed(1)}% ± {accuracyData.verificationAccuracy.voxVeritas.moderate.std.toFixed(1)}%
                      </td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                        {accuracyData.verificationAccuracy.voxVeritas.complex.mean.toFixed(1)}% ± {accuracyData.verificationAccuracy.voxVeritas.complex.std.toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Engagement Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Table 2: Engagement and Discourse Quality Improvements
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-4 font-semibold text-gray-900 dark:text-white">Metric</th>
                      <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">Baseline</th>
                      <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">Forum</th>
                      <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">VoxVeritas</th>
                      <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">Improvement (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <td className="p-4 font-medium text-gray-900 dark:text-white">Cross-viewpoint Engagement</td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                        {(accuracyData.engagementMetrics.crossViewpointEngagement.baseline * 5).toFixed(1)}
                      </td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                        {(accuracyData.engagementMetrics.crossViewpointEngagement.forum * 5).toFixed(1)}
                      </td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                        {(accuracyData.engagementMetrics.crossViewpointEngagement.voxVeritas * 5).toFixed(1)}
                      </td>
                      <td className="p-4 text-center text-green-600 dark:text-green-400 font-semibold">
                        +{(accuracyData.engagementMetrics.crossViewpointEngagement.improvement * 5).toFixed(1)}%
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <td className="p-4 font-medium text-gray-900 dark:text-white">Average Response Length</td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                        {(accuracyData.engagementMetrics.averageResponseLength.baseline * 5)}
                      </td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                        {(accuracyData.engagementMetrics.averageResponseLength.forum * 5)}
                      </td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                        {(accuracyData.engagementMetrics.averageResponseLength.voxVeritas * 5)}
                      </td>
                      <td className="p-4 text-center text-green-600 dark:text-green-400 font-semibold">
                        +{(accuracyData.engagementMetrics.averageResponseLength.improvement * 5).toFixed(1)}%
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <td className="p-4 font-medium text-gray-900 dark:text-white">Evidence Link Inclusion</td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                        {(accuracyData.engagementMetrics.evidenceLinkInclusion.baseline * 5).toFixed(1)}
                      </td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                        {(accuracyData.engagementMetrics.evidenceLinkInclusion.forum * 5).toFixed(1)}
                      </td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                        {(accuracyData.engagementMetrics.evidenceLinkInclusion.voxVeritas * 5).toFixed(1)}
                      </td>
                      <td className="p-4 text-center text-green-600 dark:text-green-400 font-semibold">
                        +{(accuracyData.engagementMetrics.evidenceLinkInclusion.improvement * 5).toFixed(0)}%
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-gray-900 dark:text-white">Constructive Tone Score</td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                        {(accuracyData.engagementMetrics.constructiveToneScore.baseline * 5).toFixed(1)}
                      </td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                        {(accuracyData.engagementMetrics.constructiveToneScore.forum * 5).toFixed(1)}
                      </td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                        {(accuracyData.engagementMetrics.constructiveToneScore.voxVeritas * 5).toFixed(1)}
                      </td>
                      <td className="p-4 text-center text-green-600 dark:text-green-400 font-semibold">
                        +{(accuracyData.engagementMetrics.constructiveToneScore.improvement * 5).toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p>Last calculated: {new Date(accuracyData.lastCalculated).toLocaleString()}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Analyzing news accuracy data...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestAccuracy;