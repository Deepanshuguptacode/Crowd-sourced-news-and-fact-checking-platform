import { useEffect } from 'react';
import config from '../config.js';
import api from '../services/api.js';

const ApiDebugger = () => {
  useEffect(() => {
    console.log('=== API DEBUG INFO ===');
    console.log('Environment:', import.meta.env.MODE);
    console.log('Is Dev:', import.meta.env.DEV);
    console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    console.log('Config BASE_URL:', config.BASE_URL);
    console.log('API Base URL:', api.defaults.baseURL);
    console.log('Current Origin:', window.location.origin);
    console.log('====================');
  }, []);

  const testApiConnection = async () => {
    try {
      console.log('Testing API connection...');
      console.log('Making request to:', api.defaults.baseURL + '/health');
      
      const response = await api.get('/health');
      console.log('API Health Check Response:', response.data);
    } catch (error) {
      console.error('API Health Check Error:', error);
      console.error('Full error object:', error.response || error);
    }
  };

  const checkAuthToken = () => {
    const token = localStorage.getItem('authToken');
    console.log('Auth Token Check:');
    console.log('Token exists:', !!token);
    console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>API Base: {config.BASE_URL}</div>
      <button 
        onClick={testApiConnection}
        style={{ 
          marginTop: '5px', 
          padding: '5px 10px', 
          background: '#007bff', 
          border: 'none', 
          borderRadius: '3px',
          color: 'white',
          cursor: 'pointer',
          marginRight: '5px'
        }}
      >
        Test API
      </button>
      <button 
        onClick={checkAuthToken}
        style={{ 
          marginTop: '5px', 
          padding: '5px 10px', 
          background: '#28a745', 
          border: 'none', 
          borderRadius: '3px',
          color: 'white',
          cursor: 'pointer'
        }}
      >
        Check Token
      </button>
    </div>
  );
};

export default ApiDebugger;
