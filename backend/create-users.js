const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const CommunityUser = require('./models/CommunityUser');
const ExpertUser = require('./models/ExpertUser');

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in .env file');
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Community users data with Indian names
const communityUsersData = [
  {
    name: 'Arjun Sharma',
    username: 'arjun_sharma1',
    email: 'comm1@mail.com',
    password: 'comm1',
    bio: 'Tech enthusiast and news analyzer from Mumbai',
    location: 'Mumbai, Maharashtra',
    interests: ['Technology', 'Politics', 'Business']
  },
  {
    name: 'Priya Patel',
    username: 'priya_patel2',
    email: 'comm2@mail.com',
    password: 'comm2',
    bio: 'Social activist and fact-checker from Delhi',
    location: 'New Delhi, Delhi',
    interests: ['Social Issues', 'Environment', 'Health']
  },
  {
    name: 'Ravi Kumar',
    username: 'ravi_kumar3',
    email: 'comm3@mail.com',
    password: 'comm3',
    bio: 'Software engineer interested in media literacy',
    location: 'Bangalore, Karnataka',
    interests: ['Technology', 'Education', 'Science']
  },
  {
    name: 'Sneha Reddy',
    username: 'sneha_reddy4',
    email: 'comm4@mail.com',
    password: 'comm4',
    bio: 'Digital marketing professional and news enthusiast',
    location: 'Hyderabad, Telangana',
    interests: ['Marketing', 'Sports', 'Entertainment']
  },
  {
    name: 'Vikram Singh',
    username: 'vikram_singh5',
    email: 'comm5@mail.com',
    password: 'comm5',
    bio: 'Student and part-time content creator',
    location: 'Jaipur, Rajasthan',
    interests: ['Education', 'Culture', 'Current Affairs']
  }
];

// Expert users data with Indian names
const expertUsersData = [
  {
    name: 'Dr. Ananya Mehta',
    username: 'dr_ananya_mehta1',
    email: 'expert1@mail.com',
    password: 'expert1',
    bio: 'Senior journalist with 15 years experience in investigative reporting',
    location: 'Mumbai, Maharashtra',
    profession: 'Journalist',
    areaOfExpertise: ['Investigative Journalism', 'Political Reporting', 'Fact Checking'],
    credentials: ['Masters in Journalism from IIMC', 'Ramnath Goenka Excellence Award'],
    experience: 15,
    interests: ['Politics', 'Investigation', 'Media Ethics']
  },
  {
    name: 'Rajesh Gupta',
    username: 'rajesh_gupta2',
    email: 'expert2@mail.com',
    password: 'expert2',
    bio: 'Media analyst and former news anchor',
    location: 'New Delhi, Delhi',
    profession: 'Media Analyst',
    areaOfExpertise: ['Media Analysis', 'Broadcasting', 'News Verification'],
    credentials: ['PhD in Mass Communication', '20+ years in broadcast journalism'],
    experience: 20,
    interests: ['Broadcasting', 'Media Studies', 'Communication']
  },
  {
    name: 'Kavitha Iyer',
    username: 'kavitha_iyer3',
    email: 'expert3@mail.com',
    password: 'expert3',
    bio: 'Fact-checking specialist and digital media expert',
    location: 'Chennai, Tamil Nadu',
    profession: 'Fact Checker',
    areaOfExpertise: ['Fact Checking', 'Digital Verification', 'OSINT'],
    credentials: ['Certified Fact Checker', 'Google News Initiative Scholar'],
    experience: 8,
    interests: ['Fact Checking', 'Digital Literacy', 'Open Source Intelligence']
  },
  {
    name: 'Suresh Nair',
    username: 'suresh_nair4',
    email: 'expert4@mail.com',
    password: 'expert4',
    bio: 'Economics correspondent and financial news expert',
    location: 'Kochi, Kerala',
    profession: 'Economics Correspondent',
    areaOfExpertise: ['Economic Reporting', 'Financial Analysis', 'Market Research'],
    credentials: ['MBA Finance', 'CFA Charter Holder'],
    experience: 12,
    interests: ['Economics', 'Finance', 'Market Analysis']
  },
  {
    name: 'Manisha Agarwal',
    username: 'manisha_agarwal5',
    email: 'expert5@mail.com',
    password: 'expert5',
    bio: 'Science journalist and health news specialist',
    location: 'Pune, Maharashtra',
    profession: 'Science Journalist',
    areaOfExpertise: ['Science Communication', 'Health Reporting', 'Medical Journalism'],
    credentials: ['MSc in Science Communication', 'Health Journalism Fellowship'],
    experience: 10,
    interests: ['Science', 'Health', 'Medical Research']
  }
];

// Hash password function
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Create community users
const createCommunityUsers = async () => {
  const createdUsers = [];
  
  console.log('Creating 5 community users...');
  
  for (let i = 0; i < communityUsersData.length; i++) {
    const userData = communityUsersData[i];
    
    try {
      // Check if user already exists
      const existingUser = await CommunityUser.findOne({ 
        $or: [{ email: userData.email }, { username: userData.username }] 
      });
      
      if (existingUser) {
        console.log(`⚠️  User already exists: ${userData.email}`);
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
        isApproved: true, // Auto-approve for testing
        socialLinks: {
          twitter: null,
          linkedin: null,
          website: null
        }
      });
      
      const savedUser = await communityUser.save();
      createdUsers.push(savedUser.toObject());
      console.log(`✓ Created community user: ${userData.name} (${userData.email})`);
      
    } catch (error) {
      console.error(`❌ Error creating community user ${userData.email}:`, error.message);
    }
  }
  
  return createdUsers;
};

// Create expert users
const createExpertUsers = async () => {
  const createdUsers = [];
  
  console.log('Creating 5 expert users...');
  
  for (let i = 0; i < expertUsersData.length; i++) {
    const userData = expertUsersData[i];
    
    try {
      // Check if user already exists
      const existingUser = await ExpertUser.findOne({ 
        $or: [{ email: userData.email }, { username: userData.username }] 
      });
      
      if (existingUser) {
        console.log(`⚠️  User already exists: ${userData.email}`);
        createdUsers.push(existingUser.toObject());
        continue;
      }
      
      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user
      const expertUser = new ExpertUser({
        name: userData.name,
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        bio: userData.bio,
        location: userData.location,
        interests: userData.interests,
        profession: userData.profession,
        areaOfExpertise: userData.areaOfExpertise,
        credentials: userData.credentials,
        experience: userData.experience,
        role: 'Expert',
        isApproved: true, // Auto-approve for testing
        socialLinks: {
          twitter: null,
          linkedin: null,
          website: null
        }
      });
      
      const savedUser = await expertUser.save();
      createdUsers.push(savedUser.toObject());
      console.log(`✓ Created expert user: ${userData.name} (${userData.email})`);
      
    } catch (error) {
      console.error(`❌ Error creating expert user ${userData.email}:`, error.message);
    }
  }
  
  return createdUsers;
};

// Main function
const createUsers = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Create users
    const communityUsers = await createCommunityUsers();
    const expertUsers = await createExpertUsers();
    
    // Prepare data for files
    const communityUserIds = communityUsers.map(user => user._id);
    const expertUserIds = expertUsers.map(user => user._id);
    
    // Save results to files
    const outputDir = __dirname;
    
    // Save community user entities
    fs.writeFileSync(
      path.join(outputDir, 'created_community_users.json'),
      JSON.stringify(communityUsers, null, 2)
    );
    
    // Save expert user entities
    fs.writeFileSync(
      path.join(outputDir, 'created_expert_users.json'),
      JSON.stringify(expertUsers, null, 2)
    );
    
    // Save community user IDs
    fs.writeFileSync(
      path.join(outputDir, 'community_user_ids.json'),
      JSON.stringify(communityUserIds, null, 2)
    );
    
    // Save expert user IDs
    fs.writeFileSync(
      path.join(outputDir, 'expert_user_ids.json'),
      JSON.stringify(expertUserIds, null, 2)
    );
    
    // Save complete summary
    const summary = {
      creationDate: new Date().toISOString(),
      communityUsersCount: communityUsers.length,
      expertUsersCount: expertUsers.length,
      totalUsersCreated: communityUsers.length + expertUsers.length,
      communityUserIds: communityUserIds,
      expertUserIds: expertUserIds,
      communityUsers: communityUsers.map(user => ({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      })),
      expertUsers: expertUsers.map(user => ({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        profession: user.profession
      }))
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'created_users_complete.json'),
      JSON.stringify(summary, null, 2)
    );
    
    console.log('\n=== USER CREATION SUMMARY ===');
    console.log(`✓ Community users created: ${communityUsers.length}`);
    console.log(`✓ Expert users created: ${expertUsers.length}`);
    console.log(`✓ Total users created: ${communityUsers.length + expertUsers.length}`);
    
    console.log('\n=== COMMUNITY USERS ===');
    communityUsers.forEach(user => {
      console.log(`• ${user.name} (${user.username}) - ${user.email}`);
    });
    
    console.log('\n=== EXPERT USERS ===');
    expertUsers.forEach(user => {
      console.log(`• ${user.name} (${user.username}) - ${user.email} [${user.profession}]`);
    });
    
    console.log('\n=== FILES CREATED ===');
    console.log('✓ created_community_users.json - Complete community user documents');
    console.log('✓ created_expert_users.json - Complete expert user documents');
    console.log('✓ community_user_ids.json - Community user ObjectIds only');
    console.log('✓ expert_user_ids.json - Expert user ObjectIds only');
    console.log('✓ created_users_complete.json - Complete creation summary');
    
  } catch (error) {
    console.error('Error in createUsers:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

// Main execution
if (require.main === module) {
  createUsers();
}

module.exports = { createUsers, createCommunityUsers, createExpertUsers };