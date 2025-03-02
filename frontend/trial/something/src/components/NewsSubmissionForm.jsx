import React, { useState } from 'react';
import axios from 'axios';

const NewsSubmissionForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    screenshots: []
  });

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
    for (const key in formData) {
      if (key === 'screenshots') {
        for (let i = 0; i < formData.screenshots.length; i++) {
          formDataToSend.append('screenshots', formData.screenshots[i]);
        }
      } else {
        formDataToSend.append(key, formData[key]);
      }
    }

    try {
      const response = await axios.post('/api/news/submit', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('News submitted successfully:', response.data);
      // Redirect or show success message
    } catch (error) {
      console.error('Error submitting news:', error);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-800">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="font-bold text-center text-white mb-6 text-5xl">Submit News</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Title"
            className="w-full p-3 mb-4 border rounded"
            required
          />
          <textarea
            id="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Description"
            className="w-full p-3 mb-4 border rounded"
            required
          />
          <input
            type="url"
            id="link"
            value={formData.link}
            onChange={handleInputChange}
            placeholder="Link"
            className="w-full p-3 mb-4 border rounded"
          />
          <input
            type="file"
            id="screenshots"
            onChange={handleFileChange}
            multiple
            className="w-full p-3 mb-4 border rounded"
          />
          <button className="w-full p-3 bg-blue-500 text-white rounded">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default NewsSubmissionForm;