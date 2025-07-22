// Debug utility to check API configuration in production
export const debugConfig = () => {
  console.log('=== API Configuration Debug ===');
  console.log('NODE_ENV:', import.meta.env.NODE_ENV);
  console.log('DEV mode:', import.meta.env.DEV);
  console.log('PROD mode:', import.meta.env.PROD);
  console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('Current BASE_URL from config:', import('../config.js').then(m => m.default.BASE_URL));
  console.log('Window location:', window.location.href);
  console.log('================================');
};
