import { useState } from 'react';
import PropTypes from 'prop-types';

const EvidenceLinksSection = ({ evidenceLinks, onEvidenceChange, maxLinks = 3 }) => {
  const [localEvidenceLinks, setLocalEvidenceLinks] = useState(
    evidenceLinks || [{ url: '', explanation: '' }]
  );

  const handleEvidenceLinkChange = (index, field, value) => {
    const updatedLinks = [...localEvidenceLinks];
    updatedLinks[index][field] = value;
    setLocalEvidenceLinks(updatedLinks);
    onEvidenceChange(updatedLinks.filter(link => link.url.trim() && link.explanation.trim()));
  };

  const addEvidenceLink = () => {
    if (localEvidenceLinks.length < maxLinks) {
      setLocalEvidenceLinks([...localEvidenceLinks, { url: '', explanation: '' }]);
    }
  };

  const removeEvidenceLink = (index) => {
    const updatedLinks = localEvidenceLinks.filter((_, i) => i !== index);
    setLocalEvidenceLinks(updatedLinks.length > 0 ? updatedLinks : [{ url: '', explanation: '' }]);
    onEvidenceChange(updatedLinks.filter(link => link.url.trim() && link.explanation.trim()));
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return string.startsWith('http://') || string.startsWith('https://');
    } catch (_) {
      return false;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Evidence Links (Optional)
        </h4>
        {localEvidenceLinks.length < maxLinks && (
          <button
            type="button"
            onClick={addEvidenceLink}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            + Add Link
          </button>
        )}
      </div>
      
      {localEvidenceLinks.map((link, index) => (
        <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Evidence Link {index + 1}
            </label>
            {localEvidenceLinks.length > 1 && (
              <button
                type="button"
                onClick={() => removeEvidenceLink(index)}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Remove
              </button>
            )}
          </div>
          
          <input
            type="url"
            placeholder="https://example.com/evidence"
            value={link.url}
            onChange={(e) => handleEvidenceLinkChange(index, 'url', e.target.value)}
            className={`w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
              link.url && !isValidUrl(link.url) 
                ? 'border-red-300 dark:border-red-500' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {link.url && !isValidUrl(link.url) && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Please enter a valid URL starting with http:// or https://
            </p>
          )}
          
          <textarea
            placeholder="Explain how this evidence supports your comment..."
            value={link.explanation}
            onChange={(e) => handleEvidenceLinkChange(index, 'explanation', e.target.value)}
            maxLength={500}
            rows={2}
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{link.explanation.length}/500 characters</span>
          </div>
        </div>
      ))}
    </div>
  );
};

EvidenceLinksSection.propTypes = {
  evidenceLinks: PropTypes.array,
  onEvidenceChange: PropTypes.func.isRequired,
  maxLinks: PropTypes.number,
};

export default EvidenceLinksSection;