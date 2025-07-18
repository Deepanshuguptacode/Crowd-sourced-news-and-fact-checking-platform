const TrendingNews = require('../models/TrendingNews');
const CommunityUser = require('../models/CommunityUser');
const axios = require('axios');
const cheerio = require('cheerio');

// Fetch article details from individual page
async function fetchArticleDetails(url) {
  try {
    const { data: html } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 10000
    });
    const $ = cheerio.load(html);
    const image = $('meta[property="og:image"]').attr('content') || '';
    const description = $('meta[property="og:description"]').attr('content') || '';
    return { image, description };
  } catch (error) {
    console.error(`Error fetching details for ${url}:`, error.message);
    return { image: '', description: '' };
  }
}

// Scrape and save trending news
async function scrapeAndSaveTrendingNews() {
  try {
    console.log('Starting news scraping...');
    
    const { data: html } = await axios.get(
      'https://www.ndtv.com/india?pfrom=home-ndtv_mainnavigation',
      { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 15000
      }
    );
    
    const $ = cheerio.load(html);
    const articles = [];

    // Collect headlines and summaries
    $('h2').each((i, elem) => {
      const titleElem = $(elem).find('a').first();
      const title = titleElem.text().trim();
      const link = titleElem.attr('href');
      
      if (!title || !link || !link.startsWith('http')) return;
      
      // Get summary from list page
      let summary = $(elem).next('p').text().trim();
      if (!summary) summary = $(elem).next().find('p').first().text().trim();
      
      articles.push({ title, link, summary });
    });

    if (!articles.length) {
      console.log('No articles found - selectors may need updating.');
      return { success: false, message: 'No articles found' };
    }

    // Limit for performance
    const maxCount = 20;
    const toProcess = articles.slice(0, maxCount);

    // Fetch detailed information for each article
    const newsArticles = await Promise.all(
      toProcess.map(async (art) => {
        const details = await fetchArticleDetails(art.link);
        return {
          title: art.title,
          link: art.link,
          image: details.image,
          description: details.description || art.summary,
          source: 'NDTV',
          category: 'India'
        };
      })
    );

    // Save to database (update if exists, create if new)
    let savedCount = 0;
    let updatedCount = 0;

    for (const newsData of newsArticles) {
      if (!newsData.title || !newsData.link) continue;

      try {
        const existingNews = await TrendingNews.findOne({ link: newsData.link });
        
        if (existingNews) {
          // Update existing news
          await TrendingNews.findByIdAndUpdate(existingNews._id, {
            ...newsData,
            fetchedAt: new Date()
          });
          updatedCount++;
        } else {
          // Create new news
          await TrendingNews.create(newsData);
          savedCount++;
        }
      } catch (error) {
        console.error(`Error saving news: ${newsData.title}`, error.message);
      }
    }

    console.log(`News scraping completed: ${savedCount} new, ${updatedCount} updated`);
    return { 
      success: true, 
      message: `Successfully processed ${savedCount + updatedCount} articles`,
      newCount: savedCount,
      updatedCount: updatedCount
    };

  } catch (error) {
    console.error('Error during news scraping:', error.message);
    return { success: false, message: error.message };
  }
}

// Get trending news with pagination
exports.getTrendingNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const trendingNews = await TrendingNews.find({ isActive: true })
      .sort({ fetchedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-reposts'); // Exclude reposts array for performance

    const total = await TrendingNews.countDocuments({ isActive: true });
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: trendingNews,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching trending news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending news'
    });
  }
};

// Get single trending news by ID
exports.getTrendingNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const news = await TrendingNews.findById(id)
      .populate('reposts.userId', 'username email profile');

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Error fetching news by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news'
    });
  }
};

// Repost news - Create a new News post from trending news
exports.repostNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment = '' } = req.body;
    const userId = req.user.id; // From auth middleware

    const News = require('../models/News');

    // Check if news exists
    const trendingNews = await TrendingNews.findById(id);
    if (!trendingNews) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    // Check if user already reposted this news by looking for existing News posts
    const existingRepost = await News.findOne({
      link: trendingNews.link,
      uploadedBy: userId
    });

    if (existingRepost) {
      return res.status(400).json({
        success: false,
        message: 'You have already reposted this news'
      });
    }

    // Create title with repost indicator and optional comment
    let repostTitle = trendingNews.title;
    if (comment.trim()) {
      repostTitle = `"${comment.trim()}" - ${trendingNews.title}`;
    }

    // Create a new News post from the trending news
    const newNewsPost = new News({
      title: repostTitle,
      description: trendingNews.description,
      link: trendingNews.link,
      screenshots: trendingNews.image ? [trendingNews.image] : [], // Convert image URL to screenshots array
      status: 'Pending', // New post starts as pending
      uploadedBy: userId,
      uploadedAt: new Date()
    });

    await newNewsPost.save();

    // Also track the repost in trending news for statistics
    trendingNews.reposts.push({
      userId,
      comment,
      repostedAt: new Date()
    });
    trendingNews.repostCount = trendingNews.reposts.length;
    await trendingNews.save();

    // Populate the new post with user info for response
    const populatedPost = await News.findById(newNewsPost._id)
      .populate('uploadedBy', 'username email name');

    res.status(200).json({
      success: true,
      message: 'News reposted successfully as a new post',
      data: {
        trendingNews: trendingNews,
        newPost: populatedPost
      }
    });
  } catch (error) {
    console.error('Error reposting news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to repost news'
    });
  }
};

// Remove repost
exports.removeRepost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const news = await TrendingNews.findById(id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    // Remove repost
    news.reposts = news.reposts.filter(
      repost => repost.userId.toString() !== userId.toString()
    );
    news.repostCount = news.reposts.length;

    await news.save();

    res.status(200).json({
      success: true,
      message: 'Repost removed successfully',
      data: news
    });
  } catch (error) {
    console.error('Error removing repost:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove repost'
    });
  }
};

// Manual fetch trending news (admin endpoint)
exports.fetchTrendingNews = async (req, res) => {
  try {
    const result = await scrapeAndSaveTrendingNews();
    
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Error in manual fetch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending news'
    });
  }
};

// Get user's reposts
exports.getUserReposts = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const userReposts = await TrendingNews.find({
      'reposts.userId': userId,
      isActive: true
    })
    .sort({ 'reposts.repostedAt': -1 })
    .skip(skip)
    .limit(limit)
    .select('title link image description reposts.$ repostCount')
    .populate('reposts.userId', 'username email profile');

    const total = await TrendingNews.countDocuments({
      'reposts.userId': userId,
      isActive: true
    });

    res.status(200).json({
      success: true,
      data: userReposts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Error fetching user reposts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user reposts'
    });
  }
};

// Export the scrape function for cron job
exports.scrapeAndSaveTrendingNews = scrapeAndSaveTrendingNews;
