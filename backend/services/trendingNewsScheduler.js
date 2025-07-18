const cron = require('cron');
const { scrapeAndSaveTrendingNews } = require('../controllers/TrendingNewsController');

class TrendingNewsScheduler {
  constructor() {
    this.job = null;
    this.isRunning = false;
  }

  // Start the cron job to fetch news every 10 minutes
  start() {
    if (this.job) {
      console.log('Trending news scheduler is already running');
      return;
    }

    // Cron pattern: every 10 minutes
    // '0 */10 * * * *' = every 10 minutes
    this.job = new cron.CronJob('0 */10 * * * *', async () => {
      if (this.isRunning) {
        console.log('Previous news fetch still running, skipping this cycle');
        return;
      }

      try {
        this.isRunning = true;
        console.log('Starting scheduled news fetch...');
        
        const result = await scrapeAndSaveTrendingNews();
        
        if (result.success) {
          console.log(`✅ Scheduled news fetch completed: ${result.newCount} new, ${result.updatedCount} updated`);
        } else {
          console.log(`❌ Scheduled news fetch failed: ${result.message}`);
        }
      } catch (error) {
        console.error('❌ Error in scheduled news fetch:', error.message);
      } finally {
        this.isRunning = false;
      }
    }, null, true, 'Asia/Kolkata'); // Indian timezone

    console.log('🔄 Trending news scheduler started - fetching news every 10 minutes');
    
    // Fetch news immediately on startup
    this.fetchNewsImmediate();
  }

  // Fetch news immediately (for startup)
  async fetchNewsImmediate() {
    try {
      console.log('🚀 Initial news fetch on startup...');
      const result = await scrapeAndSaveTrendingNews();
      
      if (result.success) {
        console.log(`✅ Initial news fetch completed: ${result.newCount} new, ${result.updatedCount} updated`);
      } else {
        console.log(`❌ Initial news fetch failed: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Error in initial news fetch:', error.message);
    }
  }

  // Stop the cron job
  stop() {
    if (this.job) {
      this.job.stop();
      this.job.destroy();
      this.job = null;
      console.log('🛑 Trending news scheduler stopped');
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isActive: this.job ? this.job.running : false,
      isFetching: this.isRunning,
      nextRun: this.job ? this.job.nextDate() : null
    };
  }
}

// Create a singleton instance
const trendingNewsScheduler = new TrendingNewsScheduler();

module.exports = trendingNewsScheduler;
