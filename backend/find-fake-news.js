const mongoose = require('mongoose');
require('dotenv').config();
const News = require('./models/News');

async function findFakeNews() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB Atlas successfully\n');

        console.log('🔍 SEARCHING FOR FAKE NEWS ARTICLES\n');

        // Method 1: Check by newsType field
        let fakeNews = await News.find({ newsType: 'fake' });
        console.log(`1. By newsType 'fake': Found ${fakeNews.length} articles`);

        // Method 2: Check by content patterns (filename or description)
        fakeNews = await News.find({ 
            $or: [
                { filename: /fake/i },
                { description: /fake/i },
                { title: /fake/i }
            ]
        });
        console.log(`2. By content patterns: Found ${fakeNews.length} articles`);

        // Method 3: Get all news and check their structure
        const allNews = await News.find({}).limit(10);
        console.log(`\n3. ALL NEWS SAMPLE (first 10):`);
        allNews.forEach((news, index) => {
            console.log(`   ${index + 1}. "${news.title?.substring(0, 50)}..."
      Type: ${news.newsType || 'undefined'}
      Filename: ${news.filename || 'undefined'}
      ID: ${news._id}`);
        });

        // Method 4: Check based on dataset source
        const buzzfeedFake = await News.find({ 
            $or: [
                { filename: /BuzzFeed.*fake/i },
                { description: /buzzfeed.*fake/i }
            ]
        });
        console.log(`\n4. BuzzFeed fake news: Found ${buzzfeedFake.length} articles`);

        const politifactFake = await News.find({ 
            $or: [
                { filename: /PolitiFact.*fake/i },
                { description: /politifact.*fake/i }
            ]
        });
        console.log(`5. PolitiFact fake news: Found ${politifactFake.length} articles`);

        // Show some examples if found
        if (allNews.length > 0) {
            console.log(`\n📋 SAMPLE NEWS DETAILS:`);
            const sampleNews = allNews.slice(0, 3);
            sampleNews.forEach((news, index) => {
                console.log(`\nNews ${index + 1}:`);
                console.log(`  ID: ${news._id}`);
                console.log(`  Title: "${news.title}"`);
                console.log(`  Type: ${news.newsType}`);
                console.log(`  Filename: ${news.filename}`);
                console.log(`  Uploader: ${news.uploader}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
}

findFakeNews();