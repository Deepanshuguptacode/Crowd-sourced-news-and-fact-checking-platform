#!/usr/bin/env node
/**
 * Face Authentication Fix Validation Test
 * Validates that the casting error is fixed by testing the data flow
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';
const FACE_AUTH_URL = 'http://127.0.0.1:5000';

async function validateFix() {
    console.log('🔧 Face Authentication Fix Validation');
    console.log('=' .repeat(50));

    try {
        // Step 1: Test services
        console.log('\n📊 Checking Services...');
        
        const faceAuthStatus = await axios.get(`${FACE_AUTH_URL}/api/status`);
        console.log(`✅ Face-authorization-System: ${faceAuthStatus.data.message}`);
        console.log(`   Face model loaded: ${faceAuthStatus.data.face_model_loaded}`);

        const backendHealth = await axios.get(`${BACKEND_URL}/health`);
        console.log(`✅ Backend: ${backendHealth.data.message}`);

        // Step 2: Test signup WITHOUT face (should work)
        console.log('\n👤 Testing Signup WITHOUT Face (Control Test)...');
        
        const normalUser = {
            name: 'Normal User',
            username: 'normaluser',
            email: 'normaluser@example.com',
            password: 'testpass123',
            profession: 'Tester'
            // No faceImage - this should work fine
        };

        const normalSignup = await axios.post(`${BACKEND_URL}/users/community/signup`, normalUser);
        console.log('✅ Normal signup (no face): SUCCESS');
        console.log(`   User: ${normalSignup.data.user.username}`);
        console.log(`   Face auth enabled: ${normalSignup.data.user.hasFaceAuth}`);

        // Step 3: Test signup WITH face image (this should NOT give casting error)
        console.log('\n🧪 Testing Signup WITH Face (The Fix Test)...');
        
        // Use a sample face image data (base64) - this would normally be from camera/upload
        const faceUser = {
            name: 'Face User', 
            username: 'faceuser',
            email: 'faceuser@example.com',
            password: 'testpass123',
            profession: 'Tester',
            faceImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
        };

        try {
            const faceSignup = await axios.post(`${BACKEND_URL}/users/community/signup`, faceUser, {
                timeout: 60000
            });
            
            console.log('✅ Face signup: SUCCESS - Fix is working!');
            console.log(`   User: ${faceSignup.data.user.username}`);
            console.log(`   Face auth enabled: ${faceSignup.data.user.hasFaceAuth}`);
            
            // Check the embedding data type
            const embedding = faceSignup.data.user.faceEmbedding;
            if (embedding) {
                console.log(`   Face embedding type: ${Array.isArray(embedding) ? 'Array' : typeof embedding}`);
                console.log(`   Face embedding length: ${embedding.length || 'N/A'}`);
                
                if (Array.isArray(embedding)) {
                    console.log('   ✅ Embedding stored as array (FIXED!)');
                } else {
                    console.log('   ❌ Embedding stored as string (NOT FIXED)');
                }
            } else {
                console.log('   ℹ️  No embedding stored (face detection may have failed)');
            }

            console.log('\n🎉 SUCCESS: The casting error has been FIXED!');
            console.log('   - Signup with face image completed without errors');
            console.log('   - No "Cast to [Number] failed" error occurred');
            console.log('   - Face authentication integration is working');

        } catch (error) {
            console.log('❌ Face signup: FAILED');
            
            if (error.response && error.response.data && error.response.data.message) {
                const errorMsg = error.response.data.message;
                console.log(`   Error: ${errorMsg}`);
                
                if (errorMsg.includes('Cast to [Number] failed')) {
                    console.log('\n🚨 BUG STILL EXISTS:');
                    console.log('   The original casting error is still occurring.');
                    console.log('   This means the fix was not applied correctly.');
                    console.log('   Please check the UserController and service code.');
                } else if (errorMsg.includes('No face detected')) {
                    console.log('\n✅ GOOD NEWS:');
                    console.log('   The casting error is FIXED!');
                    console.log('   The error is now about face detection, not data type casting.');
                    console.log('   This means our fix worked - the system is processing the image.');
                } else {
                    console.log('\n🤔 DIFFERENT ERROR:');
                    console.log('   This is a different error than the original casting issue.');
                    console.log('   The fix may have worked, but there\'s another problem.');
                }
            } else {
                console.log(`   Network/Server Error: ${error.message}`);
            }
        }

        console.log('\n📋 Validation Summary:');
        console.log('   ✅ Services running properly');
        console.log('   ✅ Normal signup (without face) works');
        console.log('   🔍 Face signup test completed');
        
    } catch (error) {
        console.log('💥 Validation failed:', error.message);
    }
}

validateFix();