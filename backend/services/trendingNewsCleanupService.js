// Trending News Cleanup Service - Maintains only the 50 most recent trending news
const TrendingNews = require('../models/TrendingNews');

class TrendingNewsCleanupService {
  /**
   * Remove trending news articles beyond the 50-item limit
   * Keeps the 50 most recent articles based on fetchedAt timestamp
   */
  static async cleanupOldTrendingNews() {
    try {
      console.log('🧹 Starting trending news cleanup...');
      
      // Count current trending news
      const totalCount = await TrendingNews.countDocuments({ isActive: true });
      console.log(`📊 Current trending news count: ${totalCount}`);
      
      if (totalCount <= 50) {
        console.log('✅ No cleanup needed - within 50 item limit');
        return {
          success: true,
          message: 'No cleanup needed',
          deletedCount: 0,
          remainingCount: totalCount
        };
      }
      
      // Calculate how many items to delete
      const excessCount = totalCount - 50;
      console.log(`🗑️  Need to remove ${excessCount} old trending news items`);
      
      // Get the oldest trending news items (sorted by fetchedAt ascending)
      const oldestNews = await TrendingNews.find({ isActive: true })
        .sort({ fetchedAt: 1 })  // Ascending order (oldest first)
        .limit(excessCount)
        .select('_id title fetchedAt');
      
      if (oldestNews.length === 0) {
        console.log('✅ No old news items found for cleanup');
        return {
          success: true,
          message: 'No old news items found',
          deletedCount: 0,
          remainingCount: totalCount
        };
      }
      
      // Extract IDs of articles to delete
      const idsToDelete = oldestNews.map(news => news._id);
      
      // Log the articles being deleted
      console.log('🗑️  Deleting the following trending news:');
      oldestNews.forEach((news, index) => {
        console.log(`   ${index + 1}. ${news.title.substring(0, 60)}... (${news.fetchedAt.toISOString()})`);
      });
      
      // Delete the old trending news
      const deleteResult = await TrendingNews.deleteMany({
        _id: { $in: idsToDelete }
      });
      
      // Verify final count
      const remainingCount = await TrendingNews.countDocuments({ isActive: true });
      
      console.log(`✅ Cleanup completed:`);
      console.log(`   - Deleted: ${deleteResult.deletedCount} trending news items`);
      console.log(`   - Remaining: ${remainingCount} trending news items`);
      
      return {
        success: true,
        message: `Successfully deleted ${deleteResult.deletedCount} old trending news items`,
        deletedCount: deleteResult.deletedCount,
        remainingCount,
        deletedItems: oldestNews.map(news => ({
          title: news.title,
          fetchedAt: news.fetchedAt
        }))
      };
      
    } catch (error) {
      console.error('❌ Error during trending news cleanup:', error);
      return {
        success: false,
        message: error.message,
        deletedCount: 0
      };
    }
  }

  /**
   * Get current trending news statistics
   */
  static async getTrendingNewsStats() {
    try {
      const totalCount = await TrendingNews.countDocuments({ isActive: true });
      const recentNews = await TrendingNews.find({ isActive: true })
        .sort({ fetchedAt: -1 })
        .limit(5)
        .select('title fetchedAt');
      
      const oldestNews = await TrendingNews.find({ isActive: true })
        .sort({ fetchedAt: 1 })
        .limit(5)
        .select('title fetchedAt');
      
      return {
        totalCount,
        maxAllowed: 50,
        needsCleanup: totalCount > 50,
        excessCount: Math.max(0, totalCount - 50),
        recentNews: recentNews.map(n => ({
          title: n.title,
          fetchedAt: n.fetchedAt
        })),
        oldestNews: oldestNews.map(n => ({
          title: n.title,
          fetchedAt: n.fetchedAt
        }))
      };
    } catch (error) {
      console.error('Error getting trending news stats:', error);
      return null;
    }
  }

  /**
   * Schedule automatic cleanup (runs after every news fetch)
   */
  static async scheduleCleanupAfterFetch() {
    try {
      const stats = await this.getTrendingNewsStats();
      if (stats && stats.needsCleanup) {
        console.log(`📈 Trending news count (${stats.totalCount}) exceeds limit (50), running cleanup...`);
        return await this.cleanupOldTrendingNews();
      }
      return { success: true, message: 'No cleanup needed', deletedCount: 0 };
    } catch (error) {
      console.error('Error in scheduled cleanup:', error);
      return { success: false, message: error.message, deletedCount: 0 };
    }
  }

  /**
   * Manual cleanup endpoint (for admin use)
   */
  static async manualCleanup() {
    console.log('🔧 Manual trending news cleanup initiated...');
    return await this.cleanupOldTrendingNews();
  }
}

module.exports = TrendingNewsCleanupService;
