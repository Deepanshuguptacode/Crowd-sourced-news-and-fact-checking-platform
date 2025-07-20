// Verification Service for News Based on Voting
const News = require('../models/News');

class VerificationService {
  /**
   * Automatically update news status based on voting patterns
   * Criteria:
   * - At least 5 votes total
   * - More than 50% upvotes = Verified
   * - More than 50% downvotes = Fake  
   * - Exactly 50% = Pending
   */
  static async updateNewsStatus(newsId) {
    try {
      const news = await News.findById(newsId);
      if (!news) return null;

      const totalVotes = news.upvotes.length + news.downvotes.length;
      
      // Need at least 5 votes to make a determination
      if (totalVotes < 5) {
        if (news.status !== 'Pending') {
          news.status = 'Pending';
          await news.save();
        }
        return news;
      }

      const upvotePercentage = (news.upvotes.length / totalVotes) * 100;
      const downvotePercentage = (news.downvotes.length / totalVotes) * 100;

      let newStatus = news.status;
      
      if (upvotePercentage > 50) {
        newStatus = 'Verified';
      } else if (downvotePercentage > 50) {
        newStatus = 'Fake';
      } else {
        // Tie case (50-50)
        newStatus = 'Pending';
      }

      if (newStatus !== news.status) {
        news.status = newStatus;
        await news.save();
        console.log(`News ${newsId} status updated to: ${newStatus} (${news.upvotes.length}↑ ${news.downvotes.length}↓)`);
      }

      return news;
    } catch (error) {
      console.error('Error updating news status:', error);
      return null;
    }
  }

  /**
   * Check all news items and update their status based on current votes
   */
  static async updateAllNewsStatus() {
    try {
      const allNews = await News.find();
      const updated = [];
      
      for (const newsItem of allNews) {
        const updatedNews = await this.updateNewsStatus(newsItem._id);
        if (updatedNews) updated.push(updatedNews);
      }
      
      return updated;
    } catch (error) {
      console.error('Error updating all news status:', error);
      return [];
    }
  }
}

module.exports = VerificationService;
