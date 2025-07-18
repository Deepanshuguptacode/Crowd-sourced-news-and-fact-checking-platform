// Simple test script to verify debate room backend integration
// Run with: node test-debate-integration.js

const express = require('express');
const mongoose = require('mongoose');

// Import models
const DebateRoom = require('./models/DebateRoom');
const DebateGroup = require('./models/DebateGroup');
const DebateComment = require('./models/DebateComment');

// Test function
async function testDebateRoomIntegration() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/DBMS', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Test 1: Create a test debate room
    console.log('\n🧪 Testing debate room creation...');
    const testRoom = new DebateRoom({
      title: 'Test Debate Room',
      description: 'A test debate room for integration testing',
      topic: 'Testing',
      creator: new mongoose.Types.ObjectId(),
      tags: ['test', 'integration']
    });
    
    const savedRoom = await testRoom.save();
    console.log('✅ Test debate room created:', savedRoom.title);

    // Test 2: Create a test comment
    console.log('\n🧪 Testing comment creation...');
    const testComment = new DebateComment({
      debateRoomId: savedRoom._id,
      text: 'This is a test comment for the debate room',
      stance: 'for',
      author: new mongoose.Types.ObjectId(),
      authorName: 'Test User'
    });
    
    const savedComment = await testComment.save();
    console.log('✅ Test comment created:', savedComment.text);

    // Test 3: Create a test group
    console.log('\n🧪 Testing group creation...');
    const testGroup = new DebateGroup({
      debateRoomId: savedRoom._id,
      label: 'Test Group',
      title: 'Test Group Title',
      description: 'A test group for testing purposes',
      stance: 'for',
      commentIds: [savedComment._id]
    });
    
    const savedGroup = await testGroup.save();
    console.log('✅ Test group created:', savedGroup.title);

    // Test 4: Update comment with group reference
    console.log('\n🧪 Testing comment-group relationship...');
    savedComment.groupId = savedGroup._id;
    await savedComment.save();
    console.log('✅ Comment linked to group');

    // Test 5: Query test - get room with populated data
    console.log('\n🧪 Testing data relationships...');
    const populatedRoom = await DebateRoom.findById(savedRoom._id);
    const populatedGroup = await DebateGroup.findById(savedGroup._id)
      .populate('commentIds');
    
    console.log('✅ Room found:', populatedRoom.title);
    console.log('✅ Group found with comments:', populatedGroup.commentIds.length);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await DebateComment.findByIdAndDelete(savedComment._id);
    await DebateGroup.findByIdAndDelete(savedGroup._id);
    await DebateRoom.findByIdAndDelete(savedRoom._id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! Debate room integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run tests
testDebateRoomIntegration();
