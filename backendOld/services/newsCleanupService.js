// Utility to clean up old news beyond 4 pages (40 items)
const News = require('../models/News');
const fs = require('fs');
const path = require('path');

class NewsCleanupService {
  /**
   * Remove news articles beyond the 4-page limit (40 items)
   */
  static async cleanupOldNews() {
    try {
      console.log('Starting news cleanup...');
      
      // Get all news sorted by upload date (newest first)
      const allNews = await News.find().sort({ uploadedAt: -1 });
      
      if (allNews.length <= 40) {
        console.log(`Total news count: ${allNews.length}. No cleanup needed.`);
        return { deleted: 0, remaining: allNews.length };
      }
      
      // Get news articles to delete (beyond first 40)
      const newsToDelete = allNews.slice(40);
      console.log(`Found ${newsToDelete.length} news articles to delete.`);
      
      let deletedCount = 0;
      
      for (const news of newsToDelete) {
        try {
          // Delete associated screenshot files
          if (news.screenshots && news.screenshots.length > 0) {
            for (const screenshot of news.screenshots) {
              // Only delete local files (not URLs)
              if (screenshot.startsWith('/uploads/screenshots/')) {
                const filePath = path.join(__dirname, '..', screenshot);
                try {
                  if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted file: ${screenshot}`);
                  }
                } catch (fileError) {
                  console.error(`Error deleting file ${screenshot}:`, fileError);
                }
              }
            }
          }
          
          // Delete the news document
          await News.findByIdAndDelete(news._id);
          deletedCount++;
          console.log(`Deleted news: ${news.title}`);
          
        } catch (deleteError) {
          console.error(`Error deleting news ${news._id}:`, deleteError);
        }
      }
      
      console.log(`News cleanup completed. Deleted: ${deletedCount} articles.`);
      return { deleted: deletedCount, remaining: 40 };
      
    } catch (error) {
      console.error('Error during news cleanup:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic cleanup (can be called periodically)
   */
  static async scheduleCleanup() {
    // Run cleanup every hour
    setInterval(async () => {
      try {
        await this.cleanupOldNews();
      } catch (error) {
        console.error('Scheduled cleanup failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour in milliseconds
    
    console.log('News cleanup scheduler started (runs every hour)');
  }

  /**
   * Get current news statistics
   */
  static async getNewsStats() {
    try {
      const totalCount = await News.countDocuments();
      const recentNews = await News.find().sort({ uploadedAt: -1 }).limit(5).select('title uploadedAt');
      
      return {
        totalCount,
        maxAllowed: 40,
        needsCleanup: totalCount > 40,
        excessCount: Math.max(0, totalCount - 40),
        recentNews: recentNews.map(n => ({
          title: n.title,
          uploadedAt: n.uploadedAt
        }))
      };
    } catch (error) {
      console.error('Error getting news stats:', error);
      return null;
    }
  }
}

module.exports = NewsCleanupService;
