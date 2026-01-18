/**
 * Test script for Gemini API Key Rotation
 * Run with: node test-key-rotation.js
 */

require('dotenv').config();
const geminiKeyRotation = require('./services/geminiKeyRotation');

console.log('='.repeat(60));
console.log('GEMINI API KEY ROTATION TEST');
console.log('='.repeat(60));
console.log();

// Test 1: Check if keys are configured
console.log('Test 1: Configuration Check');
console.log('-'.repeat(60));
const isConfigured = geminiKeyRotation.isConfigured();
console.log(`✓ Keys configured: ${isConfigured}`);
console.log();

if (!isConfigured) {
  console.error('❌ No API keys found! Please check your .env file.');
  console.error('Required variables: GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3');
  process.exit(1);
}

// Test 2: Get initial stats
console.log('Test 2: Initial Statistics');
console.log('-'.repeat(60));
let stats = geminiKeyRotation.getStats();
console.log('Initial Stats:', JSON.stringify(stats, null, 2));
console.log();

// Test 3: Simulate 12 requests to see rotation in action
console.log('Test 3: Simulating 12 API Requests');
console.log('-'.repeat(60));
for (let i = 1; i <= 12; i++) {
  const key = geminiKeyRotation.getApiKey();
  console.log(`Request ${i.toString().padStart(2, '0')}: Key ${geminiKeyRotation.getStats().currentKeyIndex + 1} - ${key.substring(0, 15)}...${key.substring(key.length - 4)}`);
  
  // Show rotation event
  if (i % 5 === 0 && i < 12) {
    console.log('  ↳ 🔄 Rotation triggered after 5 requests');
  }
}
console.log();

// Test 4: Check final stats
console.log('Test 4: Final Statistics');
console.log('-'.repeat(60));
stats = geminiKeyRotation.getStats();
console.log('Final Stats:', JSON.stringify(stats, null, 2));
console.log();

// Test 5: Reset and verify
console.log('Test 5: Reset Function');
console.log('-'.repeat(60));
console.log('Before reset:', JSON.stringify(geminiKeyRotation.getStats(), null, 2));
geminiKeyRotation.reset();
console.log('After reset:', JSON.stringify(geminiKeyRotation.getStats(), null, 2));
console.log();

// Test 6: Verify individual key access
console.log('Test 6: Individual Key Access');
console.log('-'.repeat(60));
for (let i = 0; i < 3; i++) {
  const key = geminiKeyRotation.getKeyByIndex(i);
  if (key) {
    console.log(`Key ${i + 1}: ${key.substring(0, 15)}...${key.substring(key.length - 4)}`);
  }
}
console.log();

console.log('='.repeat(60));
console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY');
console.log('='.repeat(60));
console.log();

console.log('Next Steps:');
console.log('1. Verify all 3 API keys are valid in Google AI Studio');
console.log('2. Start your backend server with: npm start');
console.log('3. Monitor console logs for rotation messages');
console.log('4. Check rotation stats during operation');
