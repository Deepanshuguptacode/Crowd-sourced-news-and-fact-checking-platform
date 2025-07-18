// Clear and test debate room functionality
const mongoose = require('mongoose');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

// Test user
const testUser = {
  name: 'Clean Test User',
  username: 'cleanuser',
  email: 'clean@example.com',
  password: 'password123'
};

let authToken = null;

// Helper function to make authenticated requests
const authenticatedRequest = async (method, url, data = null) => {
  const config = {
    method,
    url: `${API_BASE_URL}${url}`,
    headers: {
      'Cookie': authToken ? `token=${authToken}` : ''
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
};

async function cleanAndTest() {
  console.log('🧹 Cleaning and testing debate room functionality...\n');
  
  try {
    // 1. Clear existing debate rooms
    console.log('1. Clearing existing debate rooms...');
    await mongoose.connect('mongodb://localhost:27017/CrowdNews');
    await mongoose.connection.db.collection('debaterooms').deleteMany({});
    await mongoose.connection.db.collection('debategroups').deleteMany({});
    await mongoose.connection.db.collection('debatecomments').deleteMany({});
    console.log('✅ Cleared existing debate data');
    await mongoose.connection.close();
    
    // 2. Register user
    console.log('2. Registering user...');
    try {
      await axios.post(`${API_BASE_URL}/users/normal/signup`, testUser);
      console.log('✅ User registered successfully');
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️  User already exists, proceeding...');
      } else {
        throw error;
      }
    }
    
    // 3. Login user
    console.log('3. Logging in user...');
    const loginResponse = await axios.post(`${API_BASE_URL}/users/normal/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    const setCookie = loginResponse.headers['set-cookie'];
    if (setCookie) {
      const tokenMatch = setCookie[0].match(/token=([^;]+)/);
      if (tokenMatch) {
        authToken = tokenMatch[1];
        console.log('✅ User logged in successfully');
      } else {
        throw new Error('Could not extract auth token');
      }
    } else {
      throw new Error('No set-cookie header found');
    }
    
    // 4. Create a debate room
    console.log('4. Creating debate room...');
    const createResponse = await authenticatedRequest('POST', '/debate-rooms', {
      title: 'Clean Test Room',
      description: 'A room for testing clean join functionality',
      topic: 'Testing debate room join after cleanup',
      maxParticipants: 10,
      tags: ['test', 'clean']
    });
    
    const roomId = createResponse.data.data._id;
    console.log('✅ Created debate room:', roomId);
    
    // 5. Get all debate rooms
    console.log('5. Getting all debate rooms...');
    const roomsResponse = await authenticatedRequest('GET', '/debate-rooms');
    console.log('✅ Retrieved', roomsResponse.data.data.length, 'debate rooms');
    
    // 6. Try to join the room (creator should already be a participant)
    console.log('6. Attempting to join debate room (should fail - already participant)...');
    try {
      await authenticatedRequest('POST', `/debate-rooms/${roomId}/join`);
      console.log('❌ Should have failed but didn\'t');
    } catch (error) {
      if (error.response?.data?.message?.includes('already a participant')) {
        console.log('✅ Correctly rejected duplicate join attempt');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message);
      }
    }
    
    // 7. Create another user to test joining
    console.log('7. Creating second user for join test...');
    const testUser2 = {
      name: 'Join Test User',
      username: 'joinuser',
      email: 'join@example.com',
      password: 'password123'
    };
    
    try {
      await axios.post(`${API_BASE_URL}/users/normal/signup`, testUser2);
      console.log('✅ Second user registered successfully');
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️  Second user already exists, proceeding...');
      } else {
        throw error;
      }
    }
    
    // 8. Login second user
    console.log('8. Logging in second user...');
    const loginResponse2 = await axios.post(`${API_BASE_URL}/users/normal/login`, {
      email: testUser2.email,
      password: testUser2.password
    });
    
    const setCookie2 = loginResponse2.headers['set-cookie'];
    if (setCookie2) {
      const tokenMatch2 = setCookie2[0].match(/token=([^;]+)/);
      if (tokenMatch2) {
        authToken = tokenMatch2[1];
        console.log('✅ Second user logged in successfully');
      }
    }
    
    // 9. Try to join with second user
    console.log('9. Attempting to join debate room with second user...');
    const joinResponse = await authenticatedRequest('POST', `/debate-rooms/${roomId}/join`);
    
    if (joinResponse.data.success) {
      console.log('✅ Successfully joined debate room!');
      console.log(`   Message: ${joinResponse.data.message}`);
    } else {
      console.log('❌ Failed to join debate room');
      console.log(`   Error: ${joinResponse.data.message}`);
    }
    
    // 10. Verify room has 2 participants
    console.log('10. Verifying participant count...');
    const roomResponse = await authenticatedRequest('GET', `/debate-rooms/${roomId}`);
    const participantCount = roomResponse.data.data.participants.length;
    console.log(`✅ Room now has ${participantCount} participants`);
    
    console.log('\n🎉 Clean test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('   Stack trace:', error.stack);
  }
}

cleanAndTest();
