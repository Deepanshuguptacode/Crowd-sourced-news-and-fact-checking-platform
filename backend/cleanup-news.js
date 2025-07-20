// Run news cleanup utility
const NewsCleanupService = require('./services/newsCleanupService');
const mongoose = require('mongoose');
require('dotenv').config();

const runCleanup = async () => {
  try {
    console.log('🧹 Starting news cleanup process...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crowdsourced-news');
    console.log('✅ Connected to database');
    
    // Get current stats
    const statsBefore = await NewsCleanupService.getNewsStats();
    console.log('📊 Current news statistics:');
    console.log(`   Total articles: ${statsBefore.totalCount}`);
    console.log(`   Max allowed: ${statsBefore.maxAllowed}`);
    console.log(`   Needs cleanup: ${statsBefore.needsCleanup}`);
    console.log(`   Excess articles: ${statsBefore.excessCount}\n`);
    
    if (statsBefore.needsCleanup) {
      // Perform cleanup
      const result = await NewsCleanupService.cleanupOldNews();
      console.log(`\n✅ Cleanup completed:`);
      console.log(`   Deleted: ${result.deleted} articles`);
      console.log(`   Remaining: ${result.remaining} articles`);
    } else {
      console.log('✅ No cleanup needed - article count within limits');
    }
    
    // Get final stats
    const statsAfter = await NewsCleanupService.getNewsStats();
    console.log(`\n📈 Final statistics:`);
    console.log(`   Total articles: ${statsAfter.totalCount}`);
    console.log(`   Recent articles:`);
    statsAfter.recentNews.forEach((article, index) => {
      console.log(`     ${index + 1}. ${article.title} (${new Date(article.uploadedAt).toLocaleDateString()})`);
    });
    
    console.log('\n🎉 Cleanup process completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    mongoose.disconnect();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run immediately if called directly
if (require.main === module) {
  runCleanup();
}

module.exports = { runCleanup };
