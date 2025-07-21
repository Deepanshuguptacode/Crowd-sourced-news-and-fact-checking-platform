// Script to populate test trending news data
const mongoose = require('mongoose');
const TrendingNews = require('./models/TrendingNews');
const TrendingNewsCleanupService = require('./services/trendingNewsCleanupService');

async function populateTestData() {
  try {
    console.log('🌱 Populating test trending news data...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crowdsourced-news');
    console.log('📡 Connected to MongoDB');

    // Create 60 test trending news items to test cleanup (exceeding 50 limit)
    const testNewsItems = [];
    const baseDate = new Date();
    
    for (let i = 1; i <= 60; i++) {
      // Create dates in reverse chronological order (newer first)
      const fetchDate = new Date(baseDate.getTime() - (i * 24 * 60 * 60 * 1000)); // Each item is 1 day older
      
      testNewsItems.push({
        title: `Test Trending News Item ${i} - Sample Headlines from Various Sources`,
        link: `https://example.com/news/${i}`,
        image: `https://example.com/images/news${i}.jpg`,
        description: `This is a test description for trending news item ${i}. It contains sample content to test the cleanup functionality.`,
        source: 'Test Source',
        category: 'Test Category',
        fetchedAt: fetchDate,
        isActive: true,
        reposts: [],
        repostCount: 0
      });
    }

    // Insert all test data
    console.log(`📰 Creating ${testNewsItems.length} test trending news items...`);
    await TrendingNews.insertMany(testNewsItems);
    console.log('✅ Test data inserted successfully!');

    // Check current count
    const totalCount = await TrendingNews.countDocuments({ isActive: true });
    console.log(`📊 Total trending news items: ${totalCount}`);

    // Show some sample items
    const recentItems = await TrendingNews.find({ isActive: true })
      .sort({ fetchedAt: -1 })
      .limit(5)
      .select('title fetchedAt');

    console.log('\n📰 Recent Items (should be kept):');
    recentItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title} (${item.fetchedAt.toLocaleDateString()})`);
    });

    const oldestItems = await TrendingNews.find({ isActive: true })
      .sort({ fetchedAt: 1 })
      .limit(10)
      .select('title fetchedAt');

    console.log('\n📜 Oldest Items (should be deleted):');
    oldestItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title} (${item.fetchedAt.toLocaleDateString()})`);
    });

    // Now test the cleanup functionality
    console.log('\n🧹 Testing cleanup with populated data...');
    const cleanupResult = await TrendingNewsCleanupService.cleanupOldTrendingNews();
    
    if (cleanupResult.success) {
      console.log(`✅ Cleanup Result: ${cleanupResult.message}`);
      console.log(`   - Deleted: ${cleanupResult.deletedCount} items`);
      console.log(`   - Remaining: ${cleanupResult.remainingCount} items`);
      
      if (cleanupResult.deletedItems && cleanupResult.deletedItems.length > 0) {
        console.log('\n🗑️  First 5 Deleted Items:');
        cleanupResult.deletedItems.slice(0, 5).forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.title.substring(0, 60)}... (${new Date(item.fetchedAt).toLocaleDateString()})`);
        });
      }
    } else {
      console.error(`❌ Cleanup failed: ${cleanupResult.message}`);
    }

    // Final verification
    const finalCount = await TrendingNews.countDocuments({ isActive: true });
    console.log(`\n📊 Final count: ${finalCount} items (should be exactly 50)`);

    if (finalCount === 50) {
      console.log('🎉 SUCCESS: Cleanup working correctly - exactly 50 items maintained!');
    } else {
      console.log(`⚠️  WARNING: Expected 50 items, but got ${finalCount}`);
    }

    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Clear existing test data first
async function clearTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crowdsourced-news');
    await TrendingNews.deleteMany({ source: 'Test Source' });
    console.log('🧹 Cleared existing test data');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error clearing test data:', error);
  }
}

if (require.main === module) {
  clearTestData().then(() => {
    populateTestData();
  });
}

module.exports = { populateTestData, clearTestData };
