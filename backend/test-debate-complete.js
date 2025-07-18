// Comprehensive test script for debate room functionality
// Run with: node test-debate-complete.js

const axios = require('axios');
const mongoose = require('mongoose');

// Test configuration
const API_BASE_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:5173';

// Test data
const testUser = {
  name: 'Test User',
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

const testRoom = {
  title: 'Test Debate Room',
  description: 'A comprehensive test debate room',
  topic: 'Testing AI-powered debate features',
  maxParticipants: 20,
  tags: ['test', 'ai', 'debate']
};

const testComments = [
  { text: 'I believe AI will revolutionize education by personalizing learning.', stance: 'for' },
  { text: 'AI can adapt to individual learning styles and pace.', stance: 'for' },
  { text: 'AI might replace human teachers and reduce personal interaction.', stance: 'against' },
  { text: 'Students need human empathy and understanding that AI cannot provide.', stance: 'against' },
  { text: 'AI can provide 24/7 availability and instant feedback.', stance: 'for' },
  { text: 'There are serious privacy concerns with AI monitoring student behavior.', stance: 'against' }
];

let authToken = null;
let testRoomId = null;

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

// Test functions
async function testUserRegistration() {
  console.log('🧪 Testing user registration...');
  try {
    const response = await axios.post(`${API_BASE_URL}/users/normal/signup`, testUser);
    console.log('✅ User registration successful');
    return true;
  } catch (error) {
    if (error.response?.data?.message?.includes('already exists')) {
      console.log('ℹ️  User already exists, proceeding...');
      return true;
    }
    console.error('❌ User registration failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testUserLogin() {
  console.log('🧪 Testing user login...');
  try {
    const response = await axios.post(`${API_BASE_URL}/users/normal/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    // Extract token from Set-Cookie header
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      const tokenMatch = setCookie[0].match(/token=([^;]+)/);
      if (tokenMatch) {
        authToken = tokenMatch[1];
        console.log('✅ User login successful');
        return true;
      }
    }
    console.error('❌ Could not extract auth token');
    return false;
  } catch (error) {
    console.error('❌ User login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testCreateDebateRoom() {
  console.log('🧪 Testing debate room creation...');
  try {
    const response = await authenticatedRequest('POST', '/debate-rooms', testRoom);
    testRoomId = response.data.data._id;
    console.log('✅ Debate room created successfully:', testRoomId);
    return true;
  } catch (error) {
    console.error('❌ Debate room creation failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetDebateRooms() {
  console.log('🧪 Testing get all debate rooms...');
  try {
    const response = await authenticatedRequest('GET', '/debate-rooms');
    console.log('✅ Retrieved', response.data.data.length, 'debate rooms');
    return true;
  } catch (error) {
    console.error('❌ Get debate rooms failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetSpecificDebateRoom() {
  console.log('🧪 Testing get specific debate room...');
  try {
    const response = await authenticatedRequest('GET', `/debate-rooms/${testRoomId}`);
    console.log('✅ Retrieved debate room:', response.data.data.title);
    return true;
  } catch (error) {
    console.error('❌ Get specific debate room failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testJoinDebateRoom() {
  console.log('🧪 Testing join debate room...');
  try {
    const response = await authenticatedRequest('POST', `/debate-rooms/${testRoomId}/join`);
    console.log('✅ Successfully joined debate room');
    return true;
  } catch (error) {
    if (error.response?.data?.message?.includes('already a participant')) {
      console.log('ℹ️  Already a participant, proceeding...');
      return true;
    }
    console.error('❌ Join debate room failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testCreateComments() {
  console.log('🧪 Testing comment creation and AI grouping...');
  try {
    let successCount = 0;
    for (const comment of testComments) {
      try {
        const response = await authenticatedRequest('POST', `/debate-rooms/${testRoomId}/comments`, comment);
        console.log(`✅ Created comment: "${comment.text.substring(0, 50)}..."`);
        if (response.data.data.isNewGroup) {
          console.log(`  📝 Created new group: "${response.data.data.group.title}"`);
        } else {
          console.log(`  📂 Added to existing group: "${response.data.data.group.title}"`);
        }
        successCount++;
        // Wait a bit between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Failed to create comment: "${comment.text.substring(0, 50)}..."`, error.response?.data?.message || error.message);
      }
    }
    console.log(`✅ Successfully created ${successCount}/${testComments.length} comments`);
    return successCount > 0;
  } catch (error) {
    console.error('❌ Comment creation test failed:', error.message);
    return false;
  }
}

async function testGetComments() {
  console.log('🧪 Testing get comments with AI grouping...');
  try {
    const response = await authenticatedRequest('GET', `/debate-rooms/${testRoomId}/comments`);
    const { for: forGroups, against: againstGroups } = response.data.data;
    
    console.log('✅ Retrieved comments:');
    console.log(`  🟢 For groups: ${forGroups.length}`);
    forGroups.forEach(group => {
      console.log(`    📝 "${group.title}" (${group.commentIds.length} comments)`);
    });
    
    console.log(`  🔴 Against groups: ${againstGroups.length}`);
    againstGroups.forEach(group => {
      console.log(`    📝 "${group.title}" (${group.commentIds.length} comments)`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Get comments failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testLikeComment() {
  console.log('🧪 Testing comment likes...');
  try {
    // First get comments to find a comment ID
    const commentsResponse = await authenticatedRequest('GET', `/debate-rooms/${testRoomId}/comments`);
    const { for: forGroups, against: againstGroups } = commentsResponse.data.data;
    
    const allGroups = [...forGroups, ...againstGroups];
    const firstComment = allGroups[0]?.commentIds[0];
    
    if (firstComment) {
      const response = await authenticatedRequest('POST', `/debate-rooms/${testRoomId}/comments/${firstComment._id}/like`);
      console.log('✅ Comment liked successfully');
      console.log(`  👍 Likes: ${response.data.data.likes}, 👎 Dislikes: ${response.data.data.dislikes}`);
      return true;
    } else {
      console.log('ℹ️  No comments found to like');
      return true;
    }
  } catch (error) {
    console.error('❌ Like comment failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGroupRegeneration() {
  console.log('🧪 Testing group content regeneration...');
  try {
    // Get groups first
    const commentsResponse = await authenticatedRequest('GET', `/debate-rooms/${testRoomId}/comments`);
    const { for: forGroups, against: againstGroups } = commentsResponse.data.data;
    
    const allGroups = [...forGroups, ...againstGroups];
    if (allGroups.length > 0) {
      const groupToRegenerate = allGroups[0];
      const response = await authenticatedRequest('PUT', `/debate-rooms/${testRoomId}/groups/${groupToRegenerate._id}/regenerate`);
      console.log('✅ Group content regenerated successfully');
      console.log(`  📝 New title: "${response.data.data.title}"`);
      return true;
    } else {
      console.log('ℹ️  No groups found to regenerate');
      return true;
    }
  } catch (error) {
    console.error('❌ Group regeneration failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testRelinkGroups() {
  console.log('🧪 Testing group relinking...');
  try {
    const response = await authenticatedRequest('POST', `/debate-rooms/${testRoomId}/groups/relink`);
    console.log('✅ Groups relinked successfully');
    return true;
  } catch (error) {
    console.error('❌ Group relinking failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testDebugCounterStatus() {
  console.log('🧪 Testing debug counter status...');
  try {
    const response = await authenticatedRequest('GET', `/debate-rooms/${testRoomId}/debug/counter-status`);
    console.log('✅ Counter status retrieved:');
    console.log(`  📊 Total groups: ${response.data.data.totalGroups}`);
    console.log(`  🔗 Groups with counters: ${response.data.data.groupsWithCounters}`);
    return true;
  } catch (error) {
    console.error('❌ Debug counter status failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testSearchDebateRooms() {
  console.log('🧪 Testing search debate rooms...');
  try {
    const response = await authenticatedRequest('GET', '/debate-rooms?search=test');
    console.log('✅ Search completed, found', response.data.data.length, 'rooms');
    return true;
  } catch (error) {
    console.error('❌ Search debate rooms failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testUpdateDebateRoom() {
  console.log('🧪 Testing update debate room...');
  try {
    const updates = {
      title: 'Updated Test Debate Room',
      description: 'Updated description for testing'
    };
    const response = await authenticatedRequest('PUT', `/debate-rooms/${testRoomId}`, updates);
    console.log('✅ Debate room updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Update debate room failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function cleanup() {
  console.log('🧹 Cleaning up test data...');
  try {
    if (testRoomId) {
      await authenticatedRequest('DELETE', `/debate-rooms/${testRoomId}`);
      console.log('✅ Test debate room deleted');
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error.response?.data?.message || error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting comprehensive debate room functionality tests...\n');
  
  const tests = [
    { name: 'User Registration', func: testUserRegistration },
    { name: 'User Login', func: testUserLogin },
    { name: 'Create Debate Room', func: testCreateDebateRoom },
    { name: 'Get All Debate Rooms', func: testGetDebateRooms },
    { name: 'Get Specific Debate Room', func: testGetSpecificDebateRoom },
    { name: 'Join Debate Room', func: testJoinDebateRoom },
    { name: 'Create Comments with AI Grouping', func: testCreateComments },
    { name: 'Get Comments with Grouping', func: testGetComments },
    { name: 'Like Comment', func: testLikeComment },
    { name: 'Group Regeneration', func: testGroupRegeneration },
    { name: 'Relink Groups', func: testRelinkGroups },
    { name: 'Debug Counter Status', func: testDebugCounterStatus },
    { name: 'Search Debate Rooms', func: testSearchDebateRooms },
    { name: 'Update Debate Room', func: testUpdateDebateRoom }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${test.name}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      const result = await test.func();
      if (result) {
        passed++;
        console.log(`✅ ${test.name} - PASSED`);
      } else {
        failed++;
        console.log(`❌ ${test.name} - FAILED`);
      }
    } catch (error) {
      failed++;
      console.error(`❌ ${test.name} - ERROR:`, error.message);
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('🎯 TEST SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Tests Passed: ${passed}`);
  console.log(`❌ Tests Failed: ${failed}`);
  console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Debate room functionality is working correctly.');
    console.log(`\n🌐 You can now test the UI at: ${FRONTEND_URL}`);
    console.log('📝 Steps to test UI:');
    console.log('1. Navigate to the frontend URL');
    console.log('2. Register/login with a user account');
    console.log('3. Click "Debate Rooms" in the sidebar');
    console.log('4. Create a new debate room');
    console.log('5. Join the room and start commenting');
    console.log('6. Test the AI grouping by adding various comments');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Please check the errors above.`);
  }
  
  // Cleanup
  await cleanup();
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Test interrupted, cleaning up...');
  await cleanup();
  process.exit(0);
});

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error.message);
  process.exit(1);
});
