const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const { CommentGroup, CommentFilter } = require('./models/CommentFilter');
const CommunityUser = require('./models/CommunityUser');
const ExpertUser = require('./models/ExpertUser');
const News = require('./models/News');
const { CommunityComment } = require('./models/Comments');

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Comment groups data
const commentGroupsData = [
  // In Favor Groups
  {
    label: 'Strong Support',
    description: 'Comments showing strong positive endorsement and support for the news article',
    stance: 'in_favor'
  },
  {
    label: 'Factual Validation',
    description: 'Comments that verify and validate the factual accuracy of the reporting',
    stance: 'in_favor'
  },
  {
    label: 'Importance & Relevance',
    description: 'Comments highlighting the public significance and relevance of the news',
    stance: 'in_favor'
  },
  {
    label: 'Credible Sources',
    description: 'Comments praising the quality and credibility of sources used',
    stance: 'in_favor'
  },
  {
    label: 'Public Interest',
    description: 'Comments emphasizing the community benefit and public interest served',
    stance: 'in_favor'
  },
  {
    label: 'Well-researched',
    description: 'Comments acknowledging the depth and quality of research conducted',
    stance: 'in_favor'
  },
  {
    label: 'Timely Coverage',
    description: 'Comments appreciating the timeliness and relevance of the news coverage',
    stance: 'in_favor'
  },
  {
    label: 'Balanced Reporting',
    description: 'Comments recognizing objectivity and balanced presentation of information',
    stance: 'in_favor'
  },
  // Against Groups
  {
    label: 'Biased Reporting',
    description: 'Comments criticizing perceived bias or lack of objectivity in reporting',
    stance: 'against'
  },
  {
    label: 'Incomplete Information',
    description: 'Comments pointing out missing details or lack of comprehensive coverage',
    stance: 'against'
  },
  {
    label: 'Misleading Headlines',
    description: 'Comments criticizing headline accuracy and potential for misrepresentation',
    stance: 'against'
  },
  {
    label: 'Sensationalism',
    description: 'Comments criticizing dramatic tone and sensationalized approach to reporting',
    stance: 'against'
  }
];

// New community users data
const newCommunityUsersData = [
  {
    name: 'Aadhya Sharma',
    username: 'aadhya_sharma6',
    email: 'comm6@mail.com',
    password: 'comm6',
    bio: 'Media studies graduate and digital content curator from Chennai',
    location: 'Chennai, Tamil Nadu',
    interests: ['Media Studies', 'Digital Literacy', 'Current Affairs']
  },
  {
    name: 'Rohan Mehta',
    username: 'rohan_mehta7',
    email: 'comm7@mail.com',
    password: 'comm7',
    bio: 'Freelance journalist and fact-checking enthusiast from Kolkata',
    location: 'Kolkata, West Bengal',
    interests: ['Journalism', 'Fact Checking', 'Politics']
  },
  {
    name: 'Ishita Verma',
    username: 'ishita_verma8',
    email: 'comm8@mail.com',
    password: 'comm8',
    bio: 'Social media strategist and news consumer advocate from Ahmedabad',
    location: 'Ahmedabad, Gujarat',
    interests: ['Social Media', 'Consumer Rights', 'Technology']
  },
  {
    name: 'Karan Singh',
    username: 'karan_singh9',
    email: 'comm9@mail.com',
    password: 'comm9',
    bio: 'Research analyst and public policy enthusiast from Chandigarh',
    location: 'Chandigarh, Punjab',
    interests: ['Public Policy', 'Research', 'Governance']
  },
  {
    name: 'Meera Joshi',
    username: 'meera_joshi10',
    email: 'comm10@mail.com',
    password: 'comm10',
    bio: 'NGO worker and community organizer passionate about media transparency',
    location: 'Bhopal, Madhya Pradesh',
    interests: ['Social Work', 'Transparency', 'Community Development']
  }
];

// Hash password function
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Function to get random items from array
const getRandomItems = (array, count) => {
  const shuffled = array.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Step 1: Create comment groups in database
const createCommentGroups = async () => {
  console.log('\n🏷️  Creating comment groups in database...');
  
  const realNewsData = JSON.parse(fs.readFileSync('inserted_real_news_entities.json', 'utf8'));
  const createdGroups = [];
  
  for (const newsItem of realNewsData) {
    console.log(`  Creating groups for: ${newsItem.title.substring(0, 50)}...`);
    
    for (const groupData of commentGroupsData) {
      try {
        // Check if group already exists for this news
        const existingGroup = await CommentGroup.findOne({
          label: groupData.label,
          newsId: newsItem._id
        });
        
        if (!existingGroup) {
          const commentGroup = new CommentGroup({
            label: groupData.label,
            description: groupData.description,
            newsId: newsItem._id,
            embedding: [],
            comments: []
          });
          
          const savedGroup = await commentGroup.save();
          createdGroups.push({
            ...savedGroup.toObject(),
            stance: groupData.stance
          });
          
          console.log(`    ✓ Created group: ${groupData.label}`);
        } else {
          createdGroups.push({
            ...existingGroup.toObject(),
            stance: groupData.stance
          });
          console.log(`    ⚠️  Group already exists: ${groupData.label}`);
        }
      } catch (error) {
        console.error(`    ❌ Error creating group ${groupData.label}:`, error.message);
      }
    }
  }
  
  return createdGroups;
};

// Step 2: Create 5 additional community users
const createAdditionalCommunityUsers = async () => {
  console.log('\n👥 Creating 5 additional community users...');
  
  const createdUsers = [];
  
  for (const userData of newCommunityUsersData) {
    try {
      // Check if user already exists
      const existingUser = await CommunityUser.findOne({ 
        $or: [{ email: userData.email }, { username: userData.username }] 
      });
      
      if (existingUser) {
        console.log(`  ⚠️  User already exists: ${userData.email}`);
        createdUsers.push(existingUser.toObject());
        continue;
      }
      
      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user
      const communityUser = new CommunityUser({
        name: userData.name,
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        bio: userData.bio,
        location: userData.location,
        interests: userData.interests,
        role: 'Community',
        isApproved: true,
        socialLinks: {
          twitter: null,
          linkedin: null,
          website: null
        }
      });
      
      const savedUser = await communityUser.save();
      createdUsers.push(savedUser.toObject());
      console.log(`  ✓ Created user: ${userData.name} (${userData.email})`);
      
    } catch (error) {
      console.error(`  ❌ Error creating user ${userData.email}:`, error.message);
    }
  }
  
  return createdUsers;
};

// Step 3: Add upvotes and downvotes to real news
const addVotesToRealNews = async () => {
  console.log('\n👍👎 Adding upvotes and downvotes to real news...');
  
  const realNewsData = JSON.parse(fs.readFileSync('inserted_real_news_entities.json', 'utf8'));
  
  // Get all community and expert users
  const communityUsers = await CommunityUser.find({ isApproved: true });
  const expertUsers = await ExpertUser.find({ isApproved: true });
  
  console.log(`  Found ${communityUsers.length} community users and ${expertUsers.length} expert users`);
  
  const votingResults = [];
  
  for (let i = 0; i < realNewsData.length; i++) {
    const newsItem = realNewsData[i];
    console.log(`  Processing news ${i + 1}: ${newsItem.title.substring(0, 50)}...`);
    
    // Calculate voting distribution (>75% upvotes)
    const totalVoters = communityUsers.length + expertUsers.length;
    const minUpvotes = Math.ceil(totalVoters * 0.75); // At least 75% upvotes
    const maxUpvotes = totalVoters;
    const upvoteCount = Math.floor(Math.random() * (maxUpvotes - minUpvotes + 1)) + minUpvotes;
    const downvoteCount = totalVoters - upvoteCount;
    
    // Randomly select upvoters and downvoters
    const allUsers = [...communityUsers, ...expertUsers];
    const shuffledUsers = allUsers.slice().sort(() => 0.5 - Math.random());
    
    const upvoters = shuffledUsers.slice(0, upvoteCount);
    const downvoters = shuffledUsers.slice(upvoteCount, upvoteCount + downvoteCount);
    
    // Separate community and expert voters
    const communityUpvoters = upvoters.filter(user => user.role === 'Community');
    const expertUpvoters = upvoters.filter(user => user.role === 'Expert');
    const communityDownvoters = downvoters.filter(user => user.role === 'Community');
    const expertDownvoters = downvoters.filter(user => user.role === 'Expert');
    
    // Update news with votes
    try {
      await News.findByIdAndUpdate(newsItem._id, {
        $set: {
          upvotes: [
            ...communityUpvoters.map(user => user._id),
            ...expertUpvoters.map(user => user._id)
          ],
          downvotes: [
            ...communityDownvoters.map(user => user._id),
            ...expertDownvoters.map(user => user._id)
          ]
        }
      });
      
      const result = {
        newsId: newsItem._id,
        newsTitle: newsItem.title,
        totalVoters: totalVoters,
        upvotes: upvoteCount,
        downvotes: downvoteCount,
        upvotePercentage: ((upvoteCount / totalVoters) * 100).toFixed(1),
        communityUpvoters: communityUpvoters.length,
        expertUpvoters: expertUpvoters.length,
        communityDownvoters: communityDownvoters.length,
        expertDownvoters: expertDownvoters.length
      };
      
      votingResults.push(result);
      
      console.log(`    ✓ Added votes: ${upvoteCount} upvotes (${result.upvotePercentage}%), ${downvoteCount} downvotes`);
      
    } catch (error) {
      console.error(`    ❌ Error updating news ${i + 1}:`, error.message);
    }
  }
  
  return votingResults;
};

// Step 4: Create real-news-comments folder and move files
const organizeCommentFiles = async () => {
  console.log('\n📁 Creating real-news-comments folder and organizing files...');
  
  const sourceDir = __dirname;
  const targetDir = path.join(__dirname, 'real-news-comments');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
    console.log('  ✓ Created real-news-comments directory');
  }
  
  // Files to move
  const filesToMove = [
    // Individual news comment files
    ...Array.from({length: 10}, (_, i) => `news_${i + 1}_comments_corrected.json`),
    // Summary files
    'all_news_comments_corrected.json',
    'comment_generation_corrected_summary.json',
    'comment_verification_summary.json'
  ];
  
  const movedFiles = [];
  
  for (const filename of filesToMove) {
    const sourcePath = path.join(sourceDir, filename);
    const targetPath = path.join(targetDir, filename);
    
    if (fs.existsSync(sourcePath)) {
      try {
        fs.renameSync(sourcePath, targetPath);
        movedFiles.push(filename);
        console.log(`  ✓ Moved: ${filename}`);
      } catch (error) {
        console.error(`  ❌ Error moving ${filename}:`, error.message);
      }
    } else {
      console.log(`  ⚠️  File not found: ${filename}`);
    }
  }
  
  return movedFiles;
};

// Main execution function
const executeAllTasks = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Starting comprehensive news platform enhancement...\n');
    
    // Step 1: Create comment groups
    const commentGroups = await createCommentGroups();
    
    // Step 2: Create additional community users  
    const newUsers = await createAdditionalCommunityUsers();
    
    // Step 3: Add votes to real news
    const votingResults = await addVotesToRealNews();
    
    // Step 4: Organize comment files
    const movedFiles = await organizeCommentFiles();
    
    // Generate comprehensive summary
    const summary = {
      executionDate: new Date().toISOString(),
      commentGroups: {
        total: commentGroupsData.length,
        inFavor: commentGroupsData.filter(g => g.stance === 'in_favor').length,
        against: commentGroupsData.filter(g => g.stance === 'against').length,
        createdSuccessfully: commentGroups.length
      },
      newCommunityUsers: {
        attempted: newCommunityUsersData.length,
        created: newUsers.length,
        users: newUsers.map(user => ({
          name: user.name,
          username: user.username,
          email: user.email
        }))
      },
      newsVoting: {
        newsProcessed: votingResults.length,
        averageUpvotePercentage: (votingResults.reduce((sum, result) => sum + parseFloat(result.upvotePercentage), 0) / votingResults.length).toFixed(1),
        minUpvotePercentage: Math.min(...votingResults.map(r => parseFloat(r.upvotePercentage))).toFixed(1),
        maxUpvotePercentage: Math.max(...votingResults.map(r => parseFloat(r.upvotePercentage))).toFixed(1),
        totalVotes: votingResults.reduce((sum, result) => sum + result.totalVoters, 0)
      },
      fileOrganization: {
        filesAttempted: [
          ...Array.from({length: 10}, (_, i) => `news_${i + 1}_comments_corrected.json`),
          'all_news_comments_corrected.json',
          'comment_generation_corrected_summary.json',
          'comment_verification_summary.json'
        ].length,
        filesMoved: movedFiles.length,
        folderCreated: 'real-news-comments'
      },
      votingResults: votingResults
    };
    
    // Save summary
    fs.writeFileSync(
      path.join(__dirname, 'platform_enhancement_summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    // Save new users details
    fs.writeFileSync(
      path.join(__dirname, 'additional_community_users.json'),
      JSON.stringify(newUsers, null, 2)
    );
    
    console.log('\n🎉 PLATFORM ENHANCEMENT COMPLETED SUCCESSFULLY!');
    console.log('\n📊 SUMMARY:');
    console.log(`✓ Comment Groups Created: ${summary.commentGroups.createdSuccessfully}`);
    console.log(`✓ New Community Users: ${summary.newCommunityUsers.created}`);
    console.log(`✓ News with Votes Added: ${summary.newsVoting.newsProcessed}`);
    console.log(`✓ Average Upvote Rate: ${summary.newsVoting.averageUpvotePercentage}%`);
    console.log(`✓ Files Organized: ${summary.fileOrganization.filesMoved} moved to real-news-comments/`);
    
    console.log('\n📁 FILES GENERATED:');
    console.log('  ✓ platform_enhancement_summary.json - Complete execution summary');
    console.log('  ✓ additional_community_users.json - New user details');
    console.log('  ✓ real-news-comments/ - Organized comment files folder');
    
  } catch (error) {
    console.error('❌ Error during execution:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

// Run the script
if (require.main === module) {
  executeAllTasks();
}

module.exports = { 
  createCommentGroups, 
  createAdditionalCommunityUsers, 
  addVotesToRealNews, 
  organizeCommentFiles 
};