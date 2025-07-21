// Test script for trending news admin API endpoints
const axios = require('axios');

async function testTrendingNewsAPI() {
  console.log('🧪 Testing Trending News Admin API Endpoints...\n');
  
  const baseURL = 'http://localhost:3000';
  
  try {
    // Test 1: Get trending news statistics
    console.log('📊 Testing GET /trending-news/admin/stats');
    try {
      const statsResponse = await axios.get(`${baseURL}/trending-news/admin/stats`);
      console.log('✅ Stats API Success:');
      console.log(`   - Total Count: ${statsResponse.data.data.totalCount}`);
      console.log(`   - Max Allowed: ${statsResponse.data.data.maxAllowed}`);
      console.log(`   - Needs Cleanup: ${statsResponse.data.data.needsCleanup ? 'Yes' : 'No'}`);
      console.log(`   - Excess Count: ${statsResponse.data.data.excessCount}`);
      
      if (statsResponse.data.data.recentNews && statsResponse.data.data.recentNews.length > 0) {
        console.log('\n📰 Recent News Sample:');
        statsResponse.data.data.recentNews.slice(0, 3).forEach((news, index) => {
          console.log(`   ${index + 1}. ${news.title.substring(0, 50)}...`);
        });
      }
    } catch (error) {
      console.error(`❌ Stats API failed: ${error.response?.data?.message || error.message}`);
    }

    // Test 2: Manual cleanup
    console.log('\n🧹 Testing POST /trending-news/admin/cleanup');
    try {
      const cleanupResponse = await axios.post(`${baseURL}/trending-news/admin/cleanup`);
      console.log('✅ Manual Cleanup API Success:');
      console.log(`   - Message: ${cleanupResponse.data.message}`);
      console.log(`   - Deleted Count: ${cleanupResponse.data.deletedCount || 0}`);
      console.log(`   - Remaining Count: ${cleanupResponse.data.remainingCount || 'N/A'}`);
    } catch (error) {
      console.error(`❌ Manual Cleanup API failed: ${error.response?.data?.message || error.message}`);
    }

    // Test 3: Get basic trending news list
    console.log('\n📰 Testing GET /trending-news (basic list)');
    try {
      const newsResponse = await axios.get(`${baseURL}/trending-news?limit=5`);
      console.log('✅ Trending News List API Success:');
      console.log(`   - Items returned: ${newsResponse.data.data.length}`);
      console.log(`   - Total pages: ${newsResponse.data.pagination.totalPages}`);
      console.log(`   - Total items: ${newsResponse.data.pagination.totalItems}`);
      
      if (newsResponse.data.data.length > 0) {
        console.log('\n📰 Sample Headlines:');
        newsResponse.data.data.slice(0, 3).forEach((news, index) => {
          console.log(`   ${index + 1}. ${news.title.substring(0, 60)}...`);
        });
      }
    } catch (error) {
      console.error(`❌ Trending News List API failed: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🎉 API Testing Completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTrendingNewsAPI();
