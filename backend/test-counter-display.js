const { MongoClient } = require('mongodb');

async function testCounterMatching() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  
  const db = client.db('debateApp');
  const groupsCollection = db.collection('debategroups');
  const roomsCollection = db.collection('debaterooms');
  
  try {
    // Find all collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Find all groups
    const groups = await groupsCollection.find().toArray();
    console.log(`\n🔍 Found ${groups.length} groups in database`);
    
    // Find all rooms
    const rooms = await roomsCollection.find().toArray();
    console.log(`🏛️ Found ${rooms.length} rooms in database`);
    
    if (groups.length === 0) {
      console.log('❌ No groups found in database');
      return;
    }
    
    console.log('\n🔍 Testing Counter Matching System');
    console.log('=====================================');
    
    // Group by debate room
    const groupsByRoom = {};
    groups.forEach(group => {
      if (!groupsByRoom[group.debateRoomId]) {
        groupsByRoom[group.debateRoomId] = { for: [], against: [] };
      }
      groupsByRoom[group.debateRoomId][group.stance].push(group);
    });
    
    for (const [roomId, roomGroups] of Object.entries(groupsByRoom)) {
      console.log(`\n📍 Debate Room: ${roomId}`);
      console.log(`   FOR groups: ${roomGroups.for.length}`);
      console.log(`   AGAINST groups: ${roomGroups.against.length}`);
      
      // Show counter-matching status
      console.log('\n🔗 Counter-Matching Status:');
      
      roomGroups.for.forEach(group => {
        const hasCounter = group.counterGroupId ? '✅' : '❌';
        console.log(`   FOR: "${group.title}" ${hasCounter}`);
        if (group.counterGroupId) {
          const counterGroup = roomGroups.against.find(g => g._id.toString() === group.counterGroupId.toString());
          console.log(`        → Counters: "${counterGroup?.title || 'Unknown'}"`);
        }
      });
      
      roomGroups.against.forEach(group => {
        const hasCounter = group.counterGroupId ? '✅' : '❌';
        console.log(`   AGAINST: "${group.title}" ${hasCounter}`);
        if (group.counterGroupId) {
          const counterGroup = roomGroups.for.find(g => g._id.toString() === group.counterGroupId.toString());
          console.log(`        → Counters: "${counterGroup?.title || 'Unknown'}"`);
        }
      });
    }
    
    console.log('\n✅ Counter matching test completed!');
    
  } catch (error) {
    console.error('❌ Error testing counter matching:', error);
  } finally {
    await client.close();
  }
}

testCounterMatching();
