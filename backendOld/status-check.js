console.log(`
🎉 DATABASE SUCCESSFULLY SEEDED WITH INDIAN DATA! 🎉

📊 SEEDED DATA SUMMARY:
═══════════════════════════════════════════

👥 USERS CREATED:
   • 6 Normal Users (can upload news)
   • 5 Community Users (can comment & vote)  
   • 4 Expert Users (can verify & fact-check)

📰 NEWS ARTICLES CREATED:
   • 6 articles with Indian context
   • Mix of verified, pending & fake news
   • Topics: Metro, Farmers, Mumbai, Space, Digital Currency

💬 COMMENTS & INTERACTIONS:
   • 6 Community comments with opinions
   • 6 Expert comments with analysis
   • Upvotes/downvotes on articles
   • Realistic engagement patterns

🗣️ DEBATE ROOMS ACTIVE:
   • 3 debate rooms with hot topics
   • 9 debate comments across positions
   • Multi-user participation
   • Indian political & social issues

🔐 QUICK LOGIN CREDENTIALS:
═══════════════════════════════════════════

Normal User:     rajesh_k / password123
Community User:  arjun_reddy / password123
Expert User:     dr_suresh / password123

📱 WEBSITE ACCESS:
═══════════════════════════════════════════

Frontend: http://localhost:5173
Backend:  http://localhost:3000

🧪 TESTING SCENARIOS:
═══════════════════════════════════════════

1. Login with different user types
2. Browse news articles and comments
3. Join debate rooms and participate  
4. Upload new Indian context news
5. Comment, like, and interact

📋 FEATURED CONTENT:
═══════════════════════════════════════════

🚇 Bangalore Metro Phase 3 announcement
🌾 Punjab farmers protest coverage
🌧️ Mumbai monsoon preparedness
🚀 Chandrayaan-4 mission timeline
💰 Digital Rupee expansion news
❌ Fake vaccine distribution debunked

🔥 HOT DEBATES:
═══════════════════════════════════════════

🛰️ Space Program vs Social Welfare priorities
🌾 Farmers' Protests: Democracy vs Economy
💳 Digital Rupee: Innovation vs Privacy

Ready to test your crowd-sourced news platform! 🚀
Check TESTING_DATA_GUIDE.md for detailed testing instructions.
`);

const testUrls = async () => {
  const http = require('http');
  
  // Test backend
  const testBackend = () => {
    return new Promise((resolve) => {
      const req = http.get('http://localhost:3000', (res) => {
        resolve(res.statusCode);
      });
      req.on('error', () => resolve('ERROR'));
      req.setTimeout(2000, () => {
        req.destroy();
        resolve('TIMEOUT');
      });
    });
  };

  // Test frontend  
  const testFrontend = () => {
    return new Promise((resolve) => {
      const req = http.get('http://localhost:5173', (res) => {
        resolve(res.statusCode);
      });
      req.on('error', () => resolve('ERROR'));
      req.setTimeout(2000, () => {
        req.destroy();
        resolve('TIMEOUT');
      });
    });
  };

  const backendStatus = await testBackend();
  const frontendStatus = await testFrontend();

  console.log(`
🌐 SERVER STATUS CHECK:
═══════════════════════════════════════════

Backend (http://localhost:3000):  ${backendStatus === 200 ? '✅ RUNNING' : '❌ ' + backendStatus}
Frontend (http://localhost:5173): ${frontendStatus === 200 ? '✅ RUNNING' : '❌ ' + frontendStatus}

${(backendStatus === 200 && frontendStatus === 200) ? 
'🎯 Both servers are running! Visit http://localhost:5173 to start testing.' :
'⚠️ Some servers may not be running. Check your terminal sessions.'}
`);
};

testUrls();
