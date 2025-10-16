import { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { aiVerdictAPI } from '../services/api';
import { UserContext } from '../context/userContext';
import { toast } from 'react-toastify';

const AIVerdictSection = ({ newsId, onVerdictUpdate }) => {
  const [verdict, setVerdict] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showVerdict, setShowVerdict] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated, userType } = useContext(UserContext);

  // Check for existing verdict on component mount
  useEffect(() => {
    checkExistingVerdict();
  }, [newsId]);

  const checkExistingVerdict = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await aiVerdictAPI.getVerdict(newsId);
      if (response.success) {
        setVerdict(response.data);
      }
    } catch (error) {
      // 404 means no verdict exists, which is fine
      if (error.response?.status !== 404) {
        console.error('Error checking existing verdict:', error);
        setError('Failed to check existing verdict');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateVerdict = async () => {
    try {
      setGenerating(true);
      setError(null);
      const response = await aiVerdictAPI.generateVerdict(newsId);
      
      if (response.success) {
        setVerdict(response.data);
        setShowVerdict(true);
        toast.success('AI verdict generated successfully!');
        
        // Notify parent component if callback provided
        if (onVerdictUpdate) {
          onVerdictUpdate(response.data);
        }
      }
    } catch (error) {
      console.error('Error generating verdict:', error);
      const errorMessage = error.response?.data?.message || 'Failed to generate AI verdict';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const regenerateVerdict = async () => {
    try {
      setGenerating(true);
      setError(null);
      const response = await aiVerdictAPI.regenerateVerdict(newsId);
      
      if (response.success) {
        setVerdict(response.data);
        toast.success('AI verdict regenerated successfully!');
        
        // Notify parent component if callback provided
        if (onVerdictUpdate) {
          onVerdictUpdate(response.data);
        }
      }
    } catch (error) {
      console.error('Error regenerating verdict:', error);
      const errorMessage = error.response?.data?.message || 'Failed to regenerate AI verdict';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBackground = (score) => {
    if (score >= 70) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (score >= 40) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  };

  const getCredibilityLabel = (score) => {
    if (score >= 80) return 'Highly Credible';
    if (score >= 60) return 'Likely Credible';
    if (score >= 40) return 'Mixed Evidence';
    if (score >= 20) return 'Likely False';
    return 'Highly Suspicious';
  };

  const canGenerateVerdict = isAuthenticated && (userType === 'community' || userType === 'expert');

  if (loading) {
    return (
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Checking for AI verdict...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.5 2A7.5 7.5 0 0 0 2 9.5c0 5.74 7.5 14.5 7.5 14.5s7.5-8.76 7.5-14.5A7.5 7.5 0 0 0 9.5 2zm0 10a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">AI Verdict</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Comprehensive credibility analysis</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {!verdict && canGenerateVerdict && (
            <button
              onClick={generateVerdict}
              disabled={generating}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span>Generate AI Verdict</span>
                </>
              )}
            </button>
          )}

          {verdict && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowVerdict(!showVerdict)}
                className="px-3 py-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              >
                {showVerdict ? 'Hide' : 'Show'} Details
              </button>
              {canGenerateVerdict && (
                <button
                  onClick={regenerateVerdict}
                  disabled={generating}
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                >
                  {generating ? 'Updating...' : 'Regenerate'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* No Verdict State */}
      {!verdict && !canGenerateVerdict && (
        <div className="text-center py-6 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">No AI verdict available</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">Login as community/expert user to generate analysis</p>
        </div>
      )}

      {/* Verdict Summary (always visible when verdict exists) */}
      {verdict && (
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className={`text-lg font-bold ${getScoreColor(verdict.score)}`}>
                {getCredibilityLabel(verdict.score)}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Credibility Score: {verdict.score}/100
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Confidence</div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {Math.round(verdict.confidence * 100)}%
                </div>
              </div>
              <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${getScoreBackground(verdict.score)}`}
                  style={{ width: `${verdict.score}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {verdict.verdict}
          </p>
        </div>
      )}

      {/* Detailed Analysis (expandable) */}
      {verdict && showVerdict && (
        <div className="space-y-4">
          {/* Analysis Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {verdict.analysisMetadata?.totalCommentsAnalyzed || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Comments Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {verdict.topComments?.inFavor?.length || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Supporting</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                {verdict.topComments?.against?.length || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Opposing</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-600 dark:text-gray-400">
                {verdict.analysisMetadata?.commentsByStance?.general || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Neutral</div>
            </div>
          </div>

          {/* Top Comments Analysis */}
          {(verdict.topComments?.inFavor?.length > 0 || verdict.topComments?.against?.length > 0) && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Supporting Comments */}
              {verdict.topComments?.inFavor?.length > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <h5 className="font-medium text-green-800 dark:text-green-200 mb-3 flex items-center">
                    <span className="mr-2">👍</span>
                    Top Supporting Comments
                  </h5>
                  <div className="space-y-2">
                    {verdict.topComments.inFavor.slice(0, 6).map((comment, index) => (
                      <div key={index} className="p-2 bg-green-100 dark:bg-green-800/30 rounded text-sm">
                        <p className="text-green-800 dark:text-green-200 mb-1">"{comment.commentText}"</p>
                        <div className="flex items-center justify-between text-xs text-green-600 dark:text-green-400">
                          <span>{comment.commentType} comment</span>
                          <span>Score: {comment.score}</span>
                        </div>
                      </div>
                    ))}
                    {verdict.topComments.inFavor.length > 6 && (
                      <div className="text-xs text-green-600 dark:text-green-400 text-center p-2">
                        +{verdict.topComments.inFavor.length - 6} more supporting comments
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Opposing Comments */}
              {verdict.topComments?.against?.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                  <h5 className="font-medium text-red-800 dark:text-red-200 mb-3 flex items-center">
                    <span className="mr-2">👎</span>
                    Top Opposing Comments
                  </h5>
                  <div className="space-y-2">
                    {verdict.topComments.against.slice(0, 6).map((comment, index) => (
                      <div key={index} className="p-2 bg-red-100 dark:bg-red-800/30 rounded text-sm">
                        <p className="text-red-800 dark:text-red-200 mb-1">"{comment.commentText}"</p>
                        <div className="flex items-center justify-between text-xs text-red-600 dark:text-red-400">
                          <span>{comment.commentType} comment</span>
                          <span>Score: {comment.score}</span>
                        </div>
                      </div>
                    ))}
                    {verdict.topComments.against.length > 6 && (
                      <div className="text-xs text-red-600 dark:text-red-400 text-center p-2">
                        +{verdict.topComments.against.length - 6} more opposing comments
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generation Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
            Generated on {new Date(verdict.createdAt).toLocaleString()} • 
            {verdict.lastRegenerated && verdict.lastRegenerated !== verdict.createdAt && 
              ` Last updated: ${new Date(verdict.lastRegenerated).toLocaleString()}`
            }
          </div>
        </div>
      )}
    </div>
  );
};

AIVerdictSection.propTypes = {
  newsId: PropTypes.string.isRequired,
  onVerdictUpdate: PropTypes.func
};

export default AIVerdictSection;