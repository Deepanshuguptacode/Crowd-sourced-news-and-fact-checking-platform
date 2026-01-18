#!/usr/bin/env node
// startup.js - Better startup script with environment validation

console.log('🚀 Starting Crowd-Sourced News Platform Backend...\n');

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'GEMINI_API_KEY_1',
  'GEMINI_API_KEY_2',
  'GEMINI_API_KEY_3',
  'JWT_SECRET'
];

console.log('📋 Environment Variables Check:');
const missingVars = [];

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    // Show first 10 chars for security
    const displayValue = envVar === 'MONGODB_URI' 
      ? value.replace(/\/\/.*@/, '//***:***@')
      : value.substring(0, 10) + '...';
    console.log(`✅ ${envVar}: ${displayValue}`);
  } else {
    console.log(`❌ ${envVar}: Missing`);
    missingVars.push(envVar);
  }
});

// Additional environment info
console.log(`📍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`🌐 PORT: ${process.env.PORT || 3000}`);
console.log(`🔗 FRONTEND_URL: ${process.env.FRONTEND_URL || 'Not set'}\n`);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please set these variables in your Render dashboard or .env file');
  process.exit(1);
}

console.log('✅ All required environment variables are set');
console.log('🔄 Starting the main application...\n');

// Start the main application
require('./index.js');
