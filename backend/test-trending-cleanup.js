// Test script for trending news cleanup functionality
const mongoose = require('mongoose');
const TrendingNewsCleanupService = require('./services/trendingNewsCleanupService');
const TrendingNews = require('./models/TrendingNews');

async function testTrendingNewsCleanup() {
  try {
    console.log('🧪 Testing Trending News Cleanup Service...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crowdsourced-news');
    console.log('📡 Connected to MongoDB\n');

    // 1. Get current statistics
    console.log('📊 Current Statistics:');
    const initialStats = await TrendingNewsCleanupService.getTrendingNewsStats();
    if (initialStats) {
      console.log(`   - Total trending news: ${initialStats.totalCount}`);
      console.log(`   - Max allowed: ${initialStats.maxAllowed}`);
      console.log(`   - Needs cleanup: ${initialStats.needsCleanup ? 'Yes' : 'No'}`);
      console.log(`   - Excess count: ${initialStats.excessCount}`);
      
      if (initialStats.recentNews.length > 0) {
        console.log('\n📰 Most Recent News:');
        initialStats.recentNews.slice(0, 3).forEach((news, index) => {
          console.log(`   ${index + 1}. ${news.title.substring(0, 60)}... (${new Date(news.fetchedAt).toLocaleDateString()})`);
        });
      }
      
      if (initialStats.oldestNews.length > 0) {
        console.log('\n📜 Oldest News:');
        initialStats.oldestNews.slice(0, 3).forEach((news, index) => {
          console.log(`   ${index + 1}. ${news.title.substring(0, 60)}... (${new Date(news.fetchedAt).toLocaleDateString()})`);
        });
      }
    }

    // 2. Test cleanup functionality
    console.log('\n🧹 Testing Cleanup Functionality:');
    const cleanupResult = await TrendingNewsCleanupService.cleanupOldTrendingNews();
    
    if (cleanupResult.success) {
      console.log(`✅ Cleanup Result: ${cleanupResult.message}`);
      console.log(`   - Deleted: ${cleanupResult.deletedCount} items`);
      console.log(`   - Remaining: ${cleanupResult.remainingCount} items`);
      
      if (cleanupResult.deletedItems && cleanupResult.deletedItems.length > 0) {
        console.log('\n🗑️  Deleted Items:');
        cleanupResult.deletedItems.slice(0, 5).forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.title.substring(0, 60)}... (${new Date(item.fetchedAt).toLocaleDateString()})`);
        });
      }
    } else {
      console.error(`❌ Cleanup failed: ${cleanupResult.message}`);
    }

    // 3. Get final statistics
    console.log('\n📊 Final Statistics:');
    const finalStats = await TrendingNewsCleanupService.getTrendingNewsStats();
    if (finalStats) {
      console.log(`   - Total trending news: ${finalStats.totalCount}`);
      console.log(`   - Max allowed: ${finalStats.maxAllowed}`);
      console.log(`   - Needs cleanup: ${finalStats.needsCleanup ? 'Yes' : 'No'}`);
      console.log(`   - Excess count: ${finalStats.excessCount}`);
    }

    // 4. Test scheduled cleanup
    console.log('\n⏰ Testing Scheduled Cleanup:');
    const scheduledResult = await TrendingNewsCleanupService.scheduleCleanupAfterFetch();
    console.log(`   Result: ${scheduledResult.message}`);
    console.log(`   Deleted: ${scheduledResult.deletedCount} items`);

    console.log('\n🎉 Trending News Cleanup Test Completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  testTrendingNewsCleanup();
}

module.exports = testTrendingNewsCleanup;
