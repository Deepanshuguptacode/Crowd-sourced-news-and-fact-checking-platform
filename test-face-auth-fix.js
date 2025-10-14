#!/usr/bin/env node
/**
 * Face Authentication Fix Test
 * Tests the fixed face authentication signup process
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = 'http://localhost:3001';
const FACE_AUTH_URL = 'http://127.0.0.1:5000';

// Test image (base64 - you would replace this with actual image data)
const SAMPLE_IMAGE_BASE64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

async function testFaceAuthFix() {
    console.log('🧪 Testing Face Authentication Fix...\n');

    try {
        // Step 1: Check if services are running
        console.log('📊 Checking service status...');
        
        try {
            const faceAuthStatus = await axios.get(`${FACE_AUTH_URL}/api/status`, { timeout: 5000 });
            console.log('✅ Face-authorization-System: Running');
            console.log(`   Face model loaded: ${faceAuthStatus.data.face_model_loaded}`);
        } catch (error) {
            console.log('❌ Face-authorization-System: Not running');
            return;
        }

        try {
            const backendStatus = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
            console.log('✅ Backend API: Running');
        } catch (error) {
            console.log('❌ Backend API: Not running');
            return;
        }

        console.log('\n🔍 Testing face embedding extraction...');
        
        // Step 2: Test face embedding extraction directly
        try {
            const embeddingTest = await axios.post(`${FACE_AUTH_URL}/api/extract_embedding`, {
                image: SAMPLE_IMAGE_BASE64
            }, { timeout: 30000 });

            if (embeddingTest.data.success) {
                console.log('✅ Face embedding extraction: Working');
                console.log(`   Embedding length: ${embeddingTest.data.embedding.length}`);
                console.log(`   Embedding type: ${typeof embeddingTest.data.embedding[0]}`);
            } else {
                console.log('❌ Face embedding extraction: Failed');
                console.log(`   Error: ${embeddingTest.data.message}`);
            }
        } catch (error) {
            console.log('❌ Face embedding extraction: Error');
            console.log(`   Error: ${error.message}`);
        }

        console.log('\n👤 Testing platform signup with face authentication...');
        
        // Step 3: Test platform signup
        const testUser = {
            name: 'Test Face User',
            username: 'testfaceuser',
            email: 'testfaceuser@example.com',
            password: 'testpass123',
            profession: 'Tester',
            faceImage: SAMPLE_IMAGE_BASE64
        };

        try {
            const signupResponse = await axios.post(`${BACKEND_URL}/community-user/signup`, testUser, {
                timeout: 60000 // 60 second timeout for face processing
            });

            console.log('✅ Platform signup: Success');
            console.log(`   User created: ${signupResponse.data.user?.username || signupResponse.data.message}`);
            console.log(`   Face auth enabled: ${signupResponse.data.user?.hasFaceAuth}`);
            
            // Test login with the same face
            console.log('\n🔐 Testing face-based login...');
            
            const loginResponse = await axios.post(`${BACKEND_URL}/community-user/login`, {
                email: testUser.email,
                faceImage: SAMPLE_IMAGE_BASE64,
                loginMethod: 'face'
            }, { timeout: 60000 });

            console.log('✅ Face-based login: Success');
            console.log(`   Login method: ${loginResponse.data.authMethod}`);
            console.log(`   Token received: ${!!loginResponse.data.token}`);

        } catch (error) {
            console.log('❌ Platform signup/login: Failed');
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Error: ${error.response?.data?.message || error.message}`);
            
            if (error.response?.data?.message?.includes('faceEmbedding')) {
                console.log('\n🔍 Detailed error analysis:');
                console.log('   This appears to be the original casting error.');
                console.log('   The fix may not have been applied correctly.');
            }
        }

    } catch (error) {
        console.log('💥 Test failed with error:', error.message);
    }
}

// Run the test
testFaceAuthFix().then(() => {
    console.log('\n🎯 Test completed!');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
});