import PropTypes from 'prop-types';

const EvidenceDisplay = ({ evidenceLinks = [] }) => {
  if (!evidenceLinks || evidenceLinks.length === 0) {
    return null;
  }

  const handleLinkClick = (url) => {
    // Open external links in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
        </svg>
        Evidence Links ({evidenceLinks.length})
      </h5>
      
      <div className="space-y-2">
        {evidenceLinks.map((evidence, index) => (
          <div key={index} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
            <div className="flex items-start justify-between mb-2">
              <button
                onClick={() => handleLinkClick(evidence.url)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center"
              >
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
                </svg>
                Link {index + 1}
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(evidence.addedAt).toLocaleDateString()}
              </span>
            </div>
            
            <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-2">
              "{evidence.explanation}"
            </p>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {evidence.url}
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
        💡 Evidence provided by the comment author to support their statement
      </p>
    </div>
  );
};

EvidenceDisplay.propTypes = {
  evidenceLinks: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
      explanation: PropTypes.string.isRequired,
      addedAt: PropTypes.string,
    })
  ),
};

export default EvidenceDisplay;