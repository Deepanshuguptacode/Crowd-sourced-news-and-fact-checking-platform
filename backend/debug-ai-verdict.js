const mongoose = require('mongoose');
const aiVerdictService = require('./services/aiVerdictService');
const News = require('./models/News');
require('dotenv').config();

async function debugAIVerdict() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get a news article with comments
    const newsWithComments = await News.findOne().populate([
      {
        path: 'comments.community',
        populate: { path: 'commenter', select: 'username' }
      },
      {
        path: 'comments.expert', 
        populate: { path: 'expert', select: 'username' }
      }
    ]);

    if (!newsWithComments) {
      console.log('❌ No news articles found');
      return;
    }

    console.log('🔍 Testing AI verdict for news:', newsWithComments.title);
    console.log('📊 Community comments:', newsWithComments.comments?.community?.length || 0);
    console.log('📊 Expert comments:', newsWithComments.comments?.expert?.length || 0);

    // Test comment selection
    console.log('\n🎯 Testing comment selection...');
    const topComments = await aiVerdictService.selectTopComments(newsWithComments._id);
    console.log('✅ Top in_favor comments:', topComments.inFavor.length);
    console.log('✅ Top against comments:', topComments.against.length);
    
    // Print sample comments
    if (topComments.inFavor.length > 0) {
      console.log('📝 Sample in_favor comment:', topComments.inFavor[0].commentText.substring(0, 100));
    }
    if (topComments.against.length > 0) {
      console.log('📝 Sample against comment:', topComments.against[0].commentText.substring(0, 100));
    }

    // Test AI call directly
    console.log('\n🤖 Testing AI verdict generation...');
    const verdictResult = await aiVerdictService.callAIForVerdict(newsWithComments, topComments);
    
    console.log('📊 AI Verdict Result:');
    console.log('  Score:', verdictResult.score);
    console.log('  Confidence:', verdictResult.confidence);
    console.log('  Risk Level:', verdictResult.riskLevel);
    console.log('  Key Factors:', verdictResult.keyFactors);
    console.log('  Verdict length:', verdictResult.verdict?.length);
    console.log('  Verdict preview:', verdictResult.verdict?.substring(0, 200) + '...');

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the debug
debugAIVerdict();
