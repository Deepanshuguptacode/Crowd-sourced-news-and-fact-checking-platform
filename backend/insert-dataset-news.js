const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config({ path: '.env.production' });

// Import models
const News = require('./models/News');
const NormalUser = require('./models/NormalUser');

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in .env.production file');
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create a sample user for uploadedBy field
const createSampleUser = async () => {
  try {
    // Check if sample user already exists
    let sampleUser = await NormalUser.findOne({ username: 'dataset_uploader' });
    
    if (!sampleUser) {
      sampleUser = new NormalUser({
        name: 'Dataset Uploader',
        username: 'dataset_uploader',
        email: 'dataset@example.com',
        password: '$2a$10$sampleHashedPassword', // Sample hashed password
        bio: 'Automated user for uploading dataset news',
        role: 'User'
      });
      
      await sampleUser.save();
      console.log('Sample user created:', sampleUser._id);
    } else {
      console.log('Sample user found:', sampleUser._id);
    }
    
    return sampleUser._id;
  } catch (error) {
    console.error('Error creating sample user:', error);
    throw error;
  }
};

// Read CSV file and return parsed data
const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Insert news data
const insertNewsData = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Create sample user
    const uploaderId = await createSampleUser();
    
    // Read CSV files
    const fakeNewsPath = path.join(__dirname, '../dataset/BuzzFeed_fake_news_content.csv');
    const realNewsPath = path.join(__dirname, '../dataset/BuzzFeed_real_news_content.csv');
    
    console.log('Reading fake news data...');
    const fakeNewsData = await readCSV(fakeNewsPath);
    
    console.log('Reading real news data...');
    const realNewsData = await readCSV(realNewsPath);
    
    // Prepare arrays to store inserted news
    const insertedFakeNews = [];
    const insertedRealNews = [];
    const insertedFakeNewsIds = [];
    const insertedRealNewsIds = [];
    
    // Insert 10 fake news
    console.log('Inserting 10 fake news articles...');
    for (let i = 0; i < Math.min(10, fakeNewsData.length); i++) {
      const newsItem = fakeNewsData[i];
      
      // Create news object according to schema
      const fakeNews = new News({
        title: newsItem.title || `Fake News ${i + 1}`,
        description: (newsItem.text || '').substring(0, 500) + '...', // Truncate text for description
        link: newsItem.url || `https://example.com/fake-news-${i + 1}`,
        screenshots: newsItem.top_img ? [newsItem.top_img] : [],
        status: 'Fake',
        uploadedBy: uploaderId,
        uploadedAt: new Date(),
        comments: [],
        upvotes: [],
        downvotes: []
      });
      
      try {
        const savedNews = await fakeNews.save();
        insertedFakeNews.push(savedNews.toObject());
        insertedFakeNewsIds.push(savedNews._id);
        console.log(`✓ Inserted fake news ${i + 1}: ${savedNews.title.substring(0, 50)}...`);
      } catch (error) {
        console.error(`Error inserting fake news ${i + 1}:`, error.message);
      }
    }
    
    // Insert 10 real news
    console.log('Inserting 10 real news articles...');
    for (let i = 0; i < Math.min(10, realNewsData.length); i++) {
      const newsItem = realNewsData[i];
      
      // Create news object according to schema
      const realNews = new News({
        title: newsItem.title || `Real News ${i + 1}`,
        description: (newsItem.text || '').substring(0, 500) + '...', // Truncate text for description
        link: newsItem.url || `https://example.com/real-news-${i + 1}`,
        screenshots: newsItem.top_img ? [newsItem.top_img] : [],
        status: 'Verified',
        uploadedBy: uploaderId,
        uploadedAt: new Date(),
        comments: [],
        upvotes: [],
        downvotes: []
      });
      
      try {
        const savedNews = await realNews.save();
        insertedRealNews.push(savedNews.toObject());
        insertedRealNewsIds.push(savedNews._id);
        console.log(`✓ Inserted real news ${i + 1}: ${savedNews.title.substring(0, 50)}...`);
      } catch (error) {
        console.error(`Error inserting real news ${i + 1}:`, error.message);
      }
    }
    
    // Save results to files
    const outputDir = __dirname;
    
    // Save fake news entities
    fs.writeFileSync(
      path.join(outputDir, 'inserted_fake_news_entities.json'),
      JSON.stringify(insertedFakeNews, null, 2)
    );
    
    // Save real news entities
    fs.writeFileSync(
      path.join(outputDir, 'inserted_real_news_entities.json'),
      JSON.stringify(insertedRealNews, null, 2)
    );
    
    // Save fake news IDs
    fs.writeFileSync(
      path.join(outputDir, 'inserted_fake_news_ids.json'),
      JSON.stringify(insertedFakeNewsIds, null, 2)
    );
    
    // Save real news IDs
    fs.writeFileSync(
      path.join(outputDir, 'inserted_real_news_ids.json'),
      JSON.stringify(insertedRealNewsIds, null, 2)
    );
    
    // Save complete summary
    const summary = {
      insertionDate: new Date().toISOString(),
      uploadedBy: uploaderId,
      fakeNewsCount: insertedFakeNews.length,
      realNewsCount: insertedRealNews.length,
      totalInserted: insertedFakeNews.length + insertedRealNews.length,
      fakeNewsIds: insertedFakeNewsIds,
      realNewsIds: insertedRealNewsIds
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'inserted_news_complete.json'),
      JSON.stringify(summary, null, 2)
    );
    
    console.log('\n=== INSERTION SUMMARY ===');
    console.log(`✓ Fake news inserted: ${insertedFakeNews.length}`);
    console.log(`✓ Real news inserted: ${insertedRealNews.length}`);
    console.log(`✓ Total news inserted: ${insertedFakeNews.length + insertedRealNews.length}`);
    console.log(`✓ Uploader ID: ${uploaderId}`);
    console.log('\n=== FILES CREATED ===');
    console.log('✓ inserted_fake_news_entities.json - Complete fake news documents');
    console.log('✓ inserted_real_news_entities.json - Complete real news documents');
    console.log('✓ inserted_fake_news_ids.json - Fake news ObjectIds only');
    console.log('✓ inserted_real_news_ids.json - Real news ObjectIds only');
    console.log('✓ inserted_news_complete.json - Complete insertion summary');
    
  } catch (error) {
    console.error('Error in insertNewsData:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

// Check if csv-parser is available, if not, provide installation instructions
const checkDependencies = () => {
  try {
    require.resolve('csv-parser');
    return true;
  } catch (error) {
    console.error('csv-parser module not found. Please install it first:');
    console.error('npm install csv-parser');
    return false;
  }
};

// Main execution
if (require.main === module) {
  if (checkDependencies()) {
    insertNewsData();
  }
}

module.exports = { insertNewsData, connectDB, createSampleUser };