import { useState } from 'react';
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { newsAPI } from '../services/api';
import { toast } from "react-toastify";
import { FileText, Link as LinkIcon, Image, Send, Upload } from 'lucide-react';
import NavigationHeader from '../components/NavigationHeader';


const NewsSubmissionForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    screenshots: [],
    imageUrls: '' // New field for image URLs
  });
  const [imageInputType, setImageInputType] = useState('upload'); // 'upload' or 'url'
  const navigate = useNavigate(); // Initialize useNavigate

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      screenshots: e.target.files
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    
    // Add text fields
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('link', formData.link);
    
    // Add image URLs if provided
    if (formData.imageUrls.trim()) {
      // Split by lines and filter out empty lines
      const urls = formData.imageUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);
      formDataToSend.append('imageUrls', JSON.stringify(urls));
    }
    
    // Add uploaded files
    if (formData.screenshots && formData.screenshots.length > 0) {
      for (let i = 0; i < formData.screenshots.length; i++) {
        formDataToSend.append('screenshots', formData.screenshots[i]);
      }
    }

    try {
      const response = await newsAPI.uploadNews(formDataToSend);
      console.log('News submitted successfully:', response);
      toast.success(response?.message || 'News submitted successfully');
      // Redirect or show success message
      navigate('/home');
    } catch (error) {
      console.error('Error submitting news:', error);
      toast.error(error.response?.data?.message || "News submission failed");
    }
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

      {/* Header Navigation */}
      <NavigationHeader title="Submit News" />

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 relative z-10 mt-10 stage-3-form">
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-slate-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">
            <div className="grid lg:grid-cols-2">
              
              {/* Left Panel - Header Content */}
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 lg:p-12 flex flex-col justify-center text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold leading-tight">
                        Submit News
                      </h1>
                      <p className="text-blue-200 text-sm">Share breaking news with the community</p>
                    </div>
                  </div>
                  
                  <p className="text-blue-100 text-base lg:text-lg mb-8 leading-relaxed">
                    Help build a trusted news ecosystem by sharing verified information. 
                    Your submissions help the community stay informed with credible news.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-300 rounded-full mt-2 animate-pulse"></div>
                      <div>
                        <h3 className="font-semibold text-blue-100">Verify Sources</h3>
                        <p className="text-blue-200 text-sm">Ensure your news comes from credible sources</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-300 rounded-full mt-2 animate-pulse"></div>
                      <div>
                        <h3 className="font-semibold text-blue-100">Add Context</h3>
                        <p className="text-blue-200 text-sm">Provide detailed descriptions and supporting evidence</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-300 rounded-full mt-2 animate-pulse"></div>
                      <div>
                        <h3 className="font-semibold text-blue-100">Community Review</h3>
                        <p className="text-blue-200 text-sm">Your submission will be reviewed by experts</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Form */}
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="max-w-md mx-auto w-full">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Title Field */}
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">
                        News Title *
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          type="text"
                          id="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="Enter news headline"
                          className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                          required
                        />
                      </div>
                    </div>

                    {/* Description Field */}
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">
                        Description *
                      </label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Provide detailed information about the news..."
                        rows="4"
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 resize-none"
                        required
                      />
                    </div>

                    {/* Link Field */}
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">
                        Source Link
                      </label>
                      <div className="relative">
                        <LinkIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          type="url"
                          id="link"
                          value={formData.link}
                          onChange={handleInputChange}
                          placeholder="https://example.com/news-article"
                          className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Image Input Section */}
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">
                        Images (Optional)
                      </label>
                      
                      {/* Image Input Type Selector */}
                      <div className="flex mb-4 bg-slate-700/30 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => setImageInputType('upload')}
                          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                            imageInputType === 'upload'
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Upload className="w-4 h-4 inline mr-2" />
                          Upload Files
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageInputType('url')}
                          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                            imageInputType === 'url'
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <LinkIcon className="w-4 h-4 inline mr-2" />
                          Image URLs
                        </button>
                      </div>

                      {/* File Upload Option */}
                      {imageInputType === 'upload' && (
                        <div className="relative">
                          <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center hover:border-blue-500/50 transition-colors duration-200">
                            <Upload className="mx-auto w-8 h-8 text-slate-400 mb-2" />
                            <p className="text-slate-400 text-sm mb-2">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-slate-500 text-xs">
                              PNG, JPG, GIF up to 10MB each
                            </p>
                            <input
                              type="file"
                              id="screenshots"
                              onChange={handleFileChange}
                              multiple
                              accept="image/*"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                          {formData.screenshots && formData.screenshots.length > 0 && (
                            <div className="mt-2 flex items-center space-x-2 text-sm text-blue-400">
                              <Image className="w-4 h-4" />
                              <span>{formData.screenshots.length} file(s) selected</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Image URL Option */}
                      {imageInputType === 'url' && (
                        <div className="relative">
                          <textarea
                            id="imageUrls"
                            value={formData.imageUrls}
                            onChange={handleInputChange}
                            placeholder="Enter image URLs (one per line)
https://example.com/image1.jpg
https://example.com/image2.png"
                            rows="4"
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 resize-none"
                          />
                          <div className="mt-2 text-xs text-slate-500">
                            Enter each image URL on a separate line. URLs should start with http:// or https://
                          </div>
                          {formData.imageUrls && (
                            <div className="mt-2 flex items-center space-x-2 text-sm text-blue-400">
                              <Image className="w-4 h-4" />
                              <span>
                                {formData.imageUrls.split('\n').filter(url => url.trim().length > 0).length} URL(s) entered
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="stage-4-details">
                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex items-center justify-center space-x-2"
                      >
                        <Send className="w-5 h-5" />
                        <span>Submit News</span>
                      </button>
                      
                      <p className="text-slate-500 text-xs text-center mt-4">
                        By submitting, you agree that the information is accurate and from a reliable source.
                      </p>
                    </div>

                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsSubmissionForm;