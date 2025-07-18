// Quick test for join debate room functionality
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

// Test user
const testUser = {
  name: 'Debug Test User',
  username: 'debuguser',
  email: 'debug@example.com',
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

async function testJoinDebateRoom() {
  console.log('🔧 Testing join debate room functionality...\n');
  
  try {
    // 1. Register user
    console.log('1. Registering user...');
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
    
    // 2. Login user
    console.log('2. Logging in user...');
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
    
    // 3. Get available debate rooms
    console.log('3. Getting available debate rooms...');
    const roomsResponse = await authenticatedRequest('GET', '/debate-rooms');
    const rooms = roomsResponse.data.data;
    console.log(`✅ Found ${rooms.length} debate rooms`);
    
    if (rooms.length === 0) {
      console.log('⚠️  No debate rooms found, creating one...');
      const createResponse = await authenticatedRequest('POST', '/debate-rooms', {
        title: 'Debug Test Room',
        description: 'A room for testing join functionality',
        topic: 'Testing debate room join',
        maxParticipants: 10,
        tags: ['test', 'debug']
      });
      rooms.push(createResponse.data.data);
      console.log('✅ Created test debate room');
    }
    
    // 4. Try to join the first room
    console.log('4. Attempting to join debate room...');
    const targetRoom = rooms[0];
    console.log(`   Room ID: ${targetRoom._id}`);
    console.log(`   Room Title: ${targetRoom.title}`);
    
    const joinResponse = await authenticatedRequest('POST', `/debate-rooms/${targetRoom._id}/join`);
    
    if (joinResponse.data.success) {
      console.log('✅ Successfully joined debate room!');
      console.log(`   Message: ${joinResponse.data.message}`);
    } else {
      console.log('❌ Failed to join debate room');
      console.log(`   Error: ${joinResponse.data.message}`);
    }
    
    // 5. Try to join again (should fail)
    console.log('5. Attempting to join again (should fail)...');
    try {
      await authenticatedRequest('POST', `/debate-rooms/${targetRoom._id}/join`);
      console.log('❌ Should have failed but didn\'t');
    } catch (error) {
      if (error.response?.data?.message?.includes('already a participant')) {
        console.log('✅ Correctly rejected duplicate join attempt');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message);
      }
    }
    
    console.log('\n🎉 Join debate room test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('   Full error:', error);
  }
}

testJoinDebateRoom();
