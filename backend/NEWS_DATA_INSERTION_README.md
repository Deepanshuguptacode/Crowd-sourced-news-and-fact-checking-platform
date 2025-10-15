# News Data Insertion from Dataset

This document describes the successful insertion of news data from the dataset folder into MongoDB Atlas.

## Overview

Successfully inserted **20 news articles** (10 fake, 10 real) from the BuzzFeed dataset into MongoDB Atlas according to the current News schema.

## Execution Summary

- **Date**: October 15, 2025
- **Source Data**: 
  - `dataset/BuzzFeed_fake_news_content.csv` (1934 entries)
  - `dataset/BuzzFeed_real_news_content.csv` (2539 entries)
- **MongoDB URI**: Connected to VoxVeritas Atlas cluster
- **Total Inserted**: 20 news articles
- **Sample User Created**: Dataset Uploader (ID: `68ef91ef3bda87128d26e229`)

## Inserted Data Breakdown

### Fake News (10 articles)
- **Status**: Set to "Fake"
- **IDs**: Stored in `inserted_fake_news_ids.json`
- **Full Entities**: Stored in `inserted_fake_news_entities.json`

### Real News (10 articles)  
- **Status**: Set to "Verified"
- **IDs**: Stored in `inserted_real_news_ids.json`
- **Full Entities**: Stored in `inserted_real_news_entities.json`

## Data Schema Mapping

The CSV data was mapped to the News schema as follows:

```javascript
{
  title: newsItem.title,                    // From CSV 'title' column
  description: newsItem.text.substring(0, 500) + '...', // Truncated from CSV 'text'
  link: newsItem.url,                       // From CSV 'url' column
  screenshots: [newsItem.top_img],          // From CSV 'top_img' as array
  status: 'Fake' | 'Verified',              // Based on source file
  uploadedBy: sampleUser._id,               // Created sample user
  uploadedAt: new Date(),                   // Current timestamp
  comments: [],                             // Empty array
  upvotes: [],                              // Empty array
  downvotes: []                             // Empty array
}
```

## Generated Files

1. **`inserted_fake_news_entities.json`** - Complete MongoDB documents for fake news
2. **`inserted_real_news_entities.json`** - Complete MongoDB documents for real news
3. **`inserted_fake_news_ids.json`** - Array of ObjectIds for fake news only
4. **`inserted_real_news_ids.json`** - Array of ObjectIds for real news only
5. **`inserted_news_complete.json`** - Complete insertion summary with metadata

## Sample User Details

A sample user was created to satisfy the `uploadedBy` requirement:

```javascript
{
  name: 'Dataset Uploader',
  username: 'dataset_uploader', 
  email: 'dataset@example.com',
  role: 'User',
  bio: 'Automated user for uploading dataset news'
}
```

## Scripts Used

### 1. `insert-dataset-news.js`
Main insertion script that:
- Reads CSV files using csv-parser
- Creates sample user if needed
- Maps data to News schema
- Inserts 10 fake + 10 real news articles
- Generates output files with IDs and entities

### 2. `verify-inserted-data.js` 
Verification script that:
- Confirms all news were inserted correctly
- Validates IDs against saved files
- Shows database statistics
- Lists recent news entries

### 3. `check-db-connection.js`
Connection test script that:
- Validates MongoDB URI format
- Tests database connectivity
- Lists available collections

## Database State After Insertion

```
📊 Total news in database: 22 (20 new + 2 existing)
🚫 Fake news count: 10
✅ Real news count: 10  
⏳ Pending news count: 2 (existing)
👤 Sample user: Dataset Uploader
📝 News by sample user: 20
```

## Verification Results

All 20 inserted news articles verified successfully:
- ✅ 10 fake news IDs confirmed in database with status "Fake"
- ✅ 10 real news IDs confirmed in database with status "Verified" 
- ✅ All entries linked to sample user
- ✅ Schema compliance verified

## Environment Configuration

The script reads MongoDB connection from:
- **File**: `.env.production`
- **Variable**: `MONGODB_URI`
- **Value**: `mongodb+srv://deepanshugupta650:deepanshuguptacode@voxveritas.lst4gcg.mongodb.net/?retryWrites=true&w=majority&appName=VoxVeritas`

## Usage

To run the insertion script:
```bash
cd backend
node insert-dataset-news.js
```

To verify the data:
```bash
node verify-inserted-data.js
```

## Dependencies

- `mongoose` - MongoDB ODM
- `csv-parser` - CSV file parsing
- `dotenv` - Environment variable loading
- `fs` - File system operations

## Notes

- Script handles duplicate protection through unique link constraint
- Error handling for individual news insertion failures
- Automatic sample user creation and reuse
- Clean database connection management
- Comprehensive logging and status reporting