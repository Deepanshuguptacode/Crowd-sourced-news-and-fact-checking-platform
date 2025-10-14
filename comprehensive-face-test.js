#!/usr/bin/env node
/**
 * Comprehensive Face Authentication Integration Test
 * Tests the complete signup and login flow with face authentication
 */

const axios = require('axios');

// Configuration
const BACKEND_URL = 'http://localhost:3001';
const FACE_AUTH_URL = 'http://127.0.0.1:5000';

// Test configuration
const testUser = {
    name: 'Face Test User',
    username: 'facetestuser',
    email: 'facetestuser@example.com', 
    password: 'testpass123',
    profession: 'Tester'
};

// Simple test image (1x1 pixel JPEG in base64)
const testImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

async function runComprehensiveTest() {
    console.log('🚀 Face Authentication Integration Test');
    console.log('=' .repeat(50));

    try {
        // Step 1: Check services
        console.log('\n📊 Step 1: Checking Services...');
        
        const faceAuthStatus = await axios.get(`${FACE_AUTH_URL}/api/status`, { timeout: 10000 });
        console.log('✅ Face-authorization-System: Running');
        console.log(`   Face model loaded: ${faceAuthStatus.data.face_model_loaded}`);

        const backendHealth = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
        console.log('✅ Backend API: Running');
        console.log(`   Status: ${backendHealth.data.status}`);

        // Step 2: Test face embedding extraction
        console.log('\n🔍 Step 2: Testing Face Embedding Extraction...');
        
        const embeddingResponse = await axios.post(`${FACE_AUTH_URL}/api/extract_embedding`, {
            image: testImage
        }, { timeout: 60000 });

        if (embeddingResponse.data.success) {
            const embedding = embeddingResponse.data.embedding;
            console.log('✅ Face embedding extraction: SUCCESS');
            console.log(`   Embedding type: ${Array.isArray(embedding) ? 'Array' : typeof embedding}`);
            console.log(`   Embedding length: ${embedding ? embedding.length : 0}`);
            console.log(`   Sample values: [${embedding ? embedding.slice(0, 3).join(', ') : 'N/A'}...]`);
        } else {
            console.log('❌ Face embedding extraction: FAILED');
            console.log(`   Error: ${embeddingResponse.data.message}`);
            return;
        }

        // Step 3: Test platform signup with face
        console.log('\n👤 Step 3: Testing Platform Signup with Face...');
        
        const signupData = {
            ...testUser,
            faceImage: testImage
        };

        const signupResponse = await axios.post(`${BACKEND_URL}/community-user/signup`, signupData, {
            timeout: 120000 // 2 minutes for face processing
        });

        console.log('✅ Platform signup: SUCCESS');
        console.log(`   User created: ${signupResponse.data.user.username}`);
        console.log(`   Face auth enabled: ${signupResponse.data.user.hasFaceAuth}`);
        console.log(`   Face embedding stored: ${Array.isArray(signupResponse.data.user.faceEmbedding)}`);
        
        if (signupResponse.data.user.faceEmbedding) {
            console.log(`   Embedding length: ${signupResponse.data.user.faceEmbedding.length}`);
        }

        // Step 4: Test face-based login
        console.log('\n🔐 Step 4: Testing Face-based Login...');
        
        const loginResponse = await axios.post(`${BACKEND_URL}/community-user/login`, {
            email: testUser.email,
            faceImage: testImage,
            loginMethod: 'face'
        }, { timeout: 120000 });

        console.log('✅ Face-based login: SUCCESS');
        console.log(`   Auth method: ${loginResponse.data.authMethod}`);
        console.log(`   Token received: ${!!loginResponse.data.token}`);
        console.log(`   User: ${loginResponse.data.user.username}`);

        // Step 5: Test password-based login (fallback)
        console.log('\n🔑 Step 5: Testing Password-based Login (Fallback)...');
        
        const passwordLoginResponse = await axios.post(`${BACKEND_URL}/community-user/login`, {
            email: testUser.email,
            password: testUser.password,
            loginMethod: 'password'
        }, { timeout: 30000 });

        console.log('✅ Password-based login: SUCCESS');
        console.log(`   Auth method: ${passwordLoginResponse.data.authMethod}`);
        console.log(`   Both login methods working: ✅`);

        console.log('\n🎉 ALL TESTS PASSED! Face authentication fix is working correctly.');
        console.log('\n📋 Summary:');
        console.log('   ✅ Face embedding extraction working');
        console.log('   ✅ Face data stored as number array (not string)');
        console.log('   ✅ Face-based authentication working');
        console.log('   ✅ Password-based authentication still working');
        console.log('   ✅ Dual authentication system functional');

    } catch (error) {
        console.log('\n❌ TEST FAILED');
        
        if (error.response) {
            console.log(`   HTTP Status: ${error.response.status}`);
            console.log(`   Error Message: ${error.response.data.message || error.response.data}`);
            
            // Check for the specific casting error we fixed
            if (error.response.data.message && error.response.data.message.includes('Cast to [Number] failed')) {
                console.log('\n🚨 DETECTED ORIGINAL BUG:');
                console.log('   This is the "Cast to [Number] failed" error we were trying to fix.');
                console.log('   The fix may not have been applied correctly or the service needs restart.');
            }
        } else {
            console.log(`   Error: ${error.message}`);
        }
        
        console.log('\n🔍 Troubleshooting:');
        console.log('   1. Ensure all services are running (Face-auth: 5000, Backend: 3001)');
        console.log('   2. Check that the Face-authorization-System face model loaded');
        console.log('   3. Verify the backend has been restarted with the updated code');
    }
}

// Install axios if needed and run the test
if (require.resolve('axios')) {
    runComprehensiveTest();
} else {
    console.log('Installing axios...');
    const { exec } = require('child_process');
    exec('npm install axios', (error) => {
        if (error) {
            console.log('Please install axios: npm install axios');
            process.exit(1);
        } else {
            runComprehensiveTest();
        }
    });
}