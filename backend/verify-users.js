const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const CommunityUser = require('./models/CommunityUser');
const ExpertUser = require('./models/ExpertUser');

const verifyUsers = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas for user verification');
    
    // Load the expected user data
    const fs = require('fs');
    const communityUserIds = JSON.parse(fs.readFileSync('community_user_ids.json', 'utf8'));
    const expertUserIds = JSON.parse(fs.readFileSync('expert_user_ids.json', 'utf8'));
    
    console.log('\n=== COMMUNITY USERS VERIFICATION ===');
    
    // Verify community users
    for (let i = 0; i < communityUserIds.length; i++) {
      const userId = communityUserIds[i];
      const user = await CommunityUser.findById(userId);
      
      if (user) {
        console.log(`✓ Community User ${i + 1}:`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Username: ${user.username}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Location: ${user.location}`);
        console.log(`  Approved: ${user.isApproved}`);
        console.log(`  Created: ${user.createdAt.toISOString().split('T')[0]}`);
        
        // Test password verification
        const testPassword = `comm${i + 1}`;
        const isValidPassword = await bcrypt.compare(testPassword, user.password);
        console.log(`  Password (${testPassword}): ${isValidPassword ? '✓ Valid' : '❌ Invalid'}`);
        console.log('');
      } else {
        console.log(`❌ Community user with ID ${userId} not found`);
      }
    }
    
    console.log('\n=== EXPERT USERS VERIFICATION ===');
    
    // Verify expert users
    for (let i = 0; i < expertUserIds.length; i++) {
      const userId = expertUserIds[i];
      const user = await ExpertUser.findById(userId);
      
      if (user) {
        console.log(`✓ Expert User ${i + 1}:`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Username: ${user.username}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Profession: ${user.profession}`);
        console.log(`  Experience: ${user.experience} years`);
        console.log(`  Location: ${user.location}`);
        console.log(`  Approved: ${user.isApproved}`);
        console.log(`  Created: ${user.createdAt.toISOString().split('T')[0]}`);
        
        // Test password verification
        const testPassword = `expert${i + 1}`;
        const isValidPassword = await bcrypt.compare(testPassword, user.password);
        console.log(`  Password (${testPassword}): ${isValidPassword ? '✓ Valid' : '❌ Invalid'}`);
        console.log('');
      } else {
        console.log(`❌ Expert user with ID ${userId} not found`);
      }
    }
    
    // Get database statistics
    const totalCommunityUsers = await CommunityUser.countDocuments();
    const totalExpertUsers = await ExpertUser.countDocuments();
    const approvedCommunityUsers = await CommunityUser.countDocuments({ isApproved: true });
    const approvedExpertUsers = await ExpertUser.countDocuments({ isApproved: true });
    
    console.log('\n=== DATABASE STATISTICS ===');
    console.log(`📊 Total Community Users: ${totalCommunityUsers}`);
    console.log(`📊 Total Expert Users: ${totalExpertUsers}`);
    console.log(`✅ Approved Community Users: ${approvedCommunityUsers}`);
    console.log(`✅ Approved Expert Users: ${approvedExpertUsers}`);
    
    // Test login credentials summary
    console.log('\n=== LOGIN CREDENTIALS SUMMARY ===');
    console.log('📋 Community Users Login Details:');
    for (let i = 1; i <= 5; i++) {
      console.log(`   ${i}. Email: comm${i}@mail.com | Password: comm${i}`);
    }
    
    console.log('\n📋 Expert Users Login Details:');
    for (let i = 1; i <= 5; i++) {
      console.log(`   ${i}. Email: expert${i}@mail.com | Password: expert${i}`);
    }
    
    console.log('\n✅ User verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during user verification:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

verifyUsers();