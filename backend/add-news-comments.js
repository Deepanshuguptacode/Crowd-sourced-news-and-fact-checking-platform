const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const News = require('./models/News');
const { CommunityComment } = require('./models/Comments');
const CommunityUser = require('./models/CommunityUser');
const ExpertUser = require('./models/ExpertUser');

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

// Comment templates with groups
const commentTemplates = {
  inFavor: {
    strongSupport: [
      {
        text: "This is exactly the kind of investigative journalism we need! The detailed analysis and thorough research behind this article makes it incredibly valuable for understanding the current situation.",
        evidenceLinks: [
          {
            url: "https://www.journalism.org/fact-sheet/newspapers/",
            explanation: "Pew Research data shows the importance of investigative journalism in democracy"
          },
          {
            url: "https://www.poynter.org/reporting-editing/2019/why-investigative-journalism-matters/",
            explanation: "Expert analysis on the critical role of investigative reporting"
          }
        ]
      },
      {
        text: "Excellent reporting that brings important facts to light. The sources cited are credible and the analysis is well-balanced, providing readers with the information they need to form informed opinions.",
        evidenceLinks: [
          {
            url: "https://www.reuters.com/fact-check/",
            explanation: "Reuters fact-checking standards demonstrate quality journalism practices"
          },
          {
            url: "https://www.cjr.org/analysis/trust-in-journalism.php",
            explanation: "Columbia Journalism Review on building trust through quality reporting"
          }
        ]
      }
    ],
    factualValidation: [
      {
        text: "All the facts presented in this article check out. I've cross-referenced the information with multiple reliable sources and found consistent reporting across the board.",
        evidenceLinks: [
          {
            url: "https://www.factcheck.org/our-process/",
            explanation: "FactCheck.org methodology for verifying information accuracy"
          },
          {
            url: "https://apnews.com/hub/ap-fact-check",
            explanation: "Associated Press fact-checking standards and verification process"
          }
        ]
      },
      {
        text: "The data and statistics mentioned are accurate and properly sourced. This level of fact-checking is what distinguishes quality journalism from misinformation.",
        evidenceLinks: [
          {
            url: "https://www.snopes.com/fact-check/",
            explanation: "Snopes verification database confirming factual accuracy"
          },
          {
            url: "https://fullfact.org/about/our-standards/",
            explanation: "Full Fact's standards for factual verification and accuracy"
          }
        ]
      }
    ],
    importance: [
      {
        text: "This story addresses a critical issue that affects many people. The public has a right to know about these developments and this article serves the important role of keeping citizens informed.",
        evidenceLinks: [
          {
            url: "https://freedomhouse.org/report/freedom-world/2021/democracy-under-siege",
            explanation: "Freedom House report on the importance of press freedom and public information"
          },
          {
            url: "https://www.un.org/en/universal-declaration-human-rights/",
            explanation: "UN Declaration on the right to freedom of information and expression"
          }
        ]
      },
      {
        text: "The relevance of this topic to current events cannot be overstated. This reporting provides valuable context that helps readers understand broader societal implications.",
        evidenceLinks: [
          {
            url: "https://www.pewresearch.org/journalism/",
            explanation: "Pew Research on the role of journalism in informing public discourse"
          },
          {
            url: "https://www.niemanlab.org/2021/12/the-public-interest-in-local-news/",
            explanation: "Nieman Lab analysis on public interest journalism"
          }
        ]
      }
    ],
    credibleSources: [
      {
        text: "The sources quoted in this article are highly credible and well-respected in their fields. The journalist has clearly done their due diligence in finding authoritative voices.",
        evidenceLinks: [
          {
            url: "https://guides.lib.berkeley.edu/c.php?g=83917&p=539735",
            explanation: "UC Berkeley guide on evaluating source credibility"
          },
          {
            url: "https://www.apa.org/science/about/psa/2017/08/reliable-sources",
            explanation: "APA guidelines on identifying reliable and credible sources"
          }
        ]
      },
      {
        text: "The expert opinions included provide valuable insights and the diversity of sources ensures a comprehensive perspective on the issue.",
        evidenceLinks: [
          {
            url: "https://www.spj.org/ethicscode.asp",
            explanation: "Society of Professional Journalists code of ethics on source verification"
          },
          {
            url: "https://www.bbc.com/academy/en/articles/art20130702112133549",
            explanation: "BBC Academy guidelines on expert source selection and verification"
          }
        ]
      }
    ],
    publicInterest: [
      {
        text: "This article serves the public interest by exposing important information that citizens need to make informed decisions about their community and country.",
        evidenceLinks: [
          {
            url: "https://www.cpj.org/2018/09/attacks-on-the-press-public-interest-journalism/",
            explanation: "Committee to Protect Journalists on the importance of public interest reporting"
          },
          {
            url: "https://www.propublica.org/about/",
            explanation: "ProPublica's mission statement on public interest journalism"
          }
        ]
      }
    ],
    wellResearched: [
      {
        text: "The depth of research evident in this piece is impressive. The journalist has clearly spent considerable time investigating all angles of this story.",
        evidenceLinks: [
          {
            url: "https://www.ire.org/training/conferences/",
            explanation: "Investigative Reporters and Editors guidelines on thorough research methods"
          },
          {
            url: "https://www.poynter.org/reporting-editing/2018/how-to-research-like-a-pro/",
            explanation: "Poynter Institute guide on professional research techniques"
          }
        ]
      }
    ],
    timelyCoverage: [
      {
        text: "This is exactly the kind of timely reporting we need on current events. The article provides up-to-date information that helps readers stay informed about developing situations.",
        evidenceLinks: [
          {
            url: "https://www.americanpressinstitute.org/journalism-essentials/what-is-journalism/elements-journalism/",
            explanation: "American Press Institute on the importance of timely, accurate reporting"
          },
          {
            url: "https://www.niemanlab.org/2020/03/breaking-news-vs-developing-stories/",
            explanation: "Nieman Lab analysis on the importance of timely news coverage"
          }
        ]
      }
    ],
    balancedReporting: [
      {
        text: "The balanced approach taken in this article is commendable. Multiple perspectives are presented fairly, allowing readers to form their own conclusions based on comprehensive information.",
        evidenceLinks: [
          {
            url: "https://www.bbc.com/academy/en/articles/art20130702112133616",
            explanation: "BBC Academy standards on balanced and impartial reporting"
          },
          {
            url: "https://www.reuters.com/investigates/special-report/myanmar-facebook-hate/",
            explanation: "Example of balanced investigative reporting from Reuters"
          }
        ]
      }
    ]
  },
  against: {
    biasedReporting: [
      {
        text: "This article seems to have a clear bias and doesn't present opposing viewpoints fairly. The language used suggests the author has already reached a conclusion before presenting all the facts.",
        evidenceLinks: [
          {
            url: "https://www.allsides.com/media-bias/media-bias-101",
            explanation: "AllSides guide on identifying media bias in reporting"
          },
          {
            url: "https://guides.lib.umich.edu/c.php?g=637508&p=4462444",
            explanation: "University of Michigan guide on recognizing bias in news sources"
          }
        ]
      },
      {
        text: "The selective use of sources and quotes gives this piece a one-sided perspective that doesn't serve readers well. More balanced reporting would strengthen the credibility.",
        evidenceLinks: [
          {
            url: "https://www.fair.org/bias-basics/",
            explanation: "Fairness & Accuracy in Reporting (FAIR) guide on media bias detection"
          },
          {
            url: "https://www.cjr.org/criticism/bias-impartiality-objectivity.php",
            explanation: "Columbia Journalism Review on bias and objectivity in journalism"
          }
        ]
      }
    ],
    incompleteInformation: [
      {
        text: "While this article touches on an important topic, it feels incomplete. Several key aspects of the story are left unexplored, and important context is missing.",
        evidenceLinks: [
          {
            url: "https://www.poynter.org/reporting-editing/2017/what-makes-a-good-story/",
            explanation: "Poynter Institute on comprehensive storytelling in journalism"
          },
          {
            url: "https://www.americanpressinstitute.org/journalism-essentials/verification-accuracy/",
            explanation: "American Press Institute on thorough verification and completeness"
          }
        ]
      },
      {
        text: "The article raises more questions than it answers. Key details about methodology and additional sources would help readers better understand the full picture.",
        evidenceLinks: [
          {
            url: "https://www.spj.org/ethicscode.asp",
            explanation: "SPJ Code of Ethics on providing complete and accurate information"
          },
          {
            url: "https://www.cjr.org/analysis/transparency-journalism.php",
            explanation: "Columbia Journalism Review on transparency in reporting"
          }
        ]
      }
    ],
    misleadingHeadlines: [
      {
        text: "The headline doesn't accurately represent the content of the article. This kind of misleading framing can contribute to misinformation and reader confusion.",
        evidenceLinks: [
          {
            url: "https://www.poynter.org/reporting-editing/2019/how-to-write-headlines-that-work/",
            explanation: "Poynter Institute guide on accurate and ethical headline writing"
          },
          {
            url: "https://www.cjr.org/analysis/headlines-clickbait-journalism.php",
            explanation: "Columbia Journalism Review on the problem of misleading headlines"
          }
        ]
      },
      {
        text: "The sensationalized headline creates expectations that the article content doesn't fulfill. More accurate headline writing would better serve readers.",
        evidenceLinks: [
          {
            url: "https://www.niemanlab.org/2020/01/headlines-matter-more-than-ever/",
            explanation: "Nieman Lab analysis on the importance of accurate headlines"
          },
          {
            url: "https://www.americanpressinstitute.org/journalism-essentials/bias-objectivity/",
            explanation: "API guidance on avoiding bias in headlines and framing"
          }
        ]
      }
    ],
    sensationalism: [
      {
        text: "This article relies too heavily on sensational language rather than factual reporting. The dramatic tone detracts from the important underlying issues.",
        evidenceLinks: [
          {
            url: "https://www.fair.org/extra/sensationalism-vs-journalism/",
            explanation: "FAIR analysis on the difference between sensationalism and quality journalism"
          },
          {
            url: "https://www.cjr.org/criticism/sensationalism-news-media.php",
            explanation: "Columbia Journalism Review critique of sensationalism in news media"
          }
        ]
      },
      {
        text: "The focus on shocking details overshadows the need for careful analysis and context. More measured reporting would better serve the public interest.",
        evidenceLinks: [
          {
            url: "https://www.poynter.org/ethics-trust/2018/sensationalism-in-journalism/",
            explanation: "Poynter Institute discussion on avoiding sensationalism in reporting"
          },
          {
            url: "https://www.spj.org/ethicscode.asp",
            explanation: "Society of Professional Journalists ethics code on responsible reporting"
          }
        ]
      }
    ]
  }
};

// Expert vote explanations
const expertVoteExplanations = {
  upvote: [
    "This comment provides valuable insight and demonstrates critical thinking about the article.",
    "Well-reasoned analysis with credible supporting evidence. Adds to the discussion quality.",
    "Constructive feedback that helps readers understand different perspectives on the topic.",
    "The evidence provided supports the commenter's perspective effectively.",
    "This comment demonstrates good media literacy and fact-checking practices."
  ],
  downvote: [
    "The criticism lacks constructive elements and doesn't advance meaningful discussion.",
    "Claims made without sufficient evidence or proper sourcing to support the argument.",
    "The tone is unnecessarily harsh and doesn't contribute to productive dialogue.",
    "Factual inaccuracies undermine the validity of the points being made.",
    "Overly biased perspective that doesn't acknowledge complexity of the issue."
  ]
};

// Function to get random items from array
const getRandomItems = (array, count) => {
  const shuffled = array.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Function to get random item from array
const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Generate comments for a news article
const generateCommentsForNews = async (newsItem, communityUsers, expertUsers) => {
  const comments = [];
  
  // Generate in-favor comments (12 total)
  const inFavorGroups = [
    { group: 'strongSupport', count: 2 },
    { group: 'factualValidation', count: 2 },
    { group: 'importance', count: 2 },
    { group: 'credibleSources', count: 2 },
    { group: 'publicInterest', count: 1 },
    { group: 'wellResearched', count: 1 },
    { group: 'timelyCoverage', count: 1 },
    { group: 'balancedReporting', count: 1 }
  ];

  // Generate against comments (8 total)
  const againstGroups = [
    { group: 'biasedReporting', count: 2 },
    { group: 'incompleteInformation', count: 2 },
    { group: 'misleadingHeadlines', count: 2 },
    { group: 'sensationalism', count: 2 }
  ];

  let commentIndex = 0;

  // Generate in-favor comments
  for (const groupInfo of inFavorGroups) {
    const templates = commentTemplates.inFavor[groupInfo.group];
    for (let i = 0; i < groupInfo.count; i++) {
      const template = templates[i % templates.length];
      const commenter = getRandomItem(communityUsers);
      
      // Generate expert votes (favor comments get more upvotes)
      const expertVotes = [];
      const upvoteCount = Math.floor(Math.random() * 3) + 3; // 3-5 upvotes
      const downvoteCount = Math.floor(Math.random() * 2); // 0-1 downvotes
      
      const upvotingExperts = getRandomItems(expertUsers, upvoteCount);
      const remainingExperts = expertUsers.filter(expert => 
        !upvotingExperts.some(upvoter => upvoter._id.toString() === expert._id.toString())
      );
      const downvotingExperts = getRandomItems(remainingExperts, downvoteCount);

      // Add upvotes
      upvotingExperts.forEach(expert => {
        expertVotes.push({
          expert: expert._id,
          voteType: 'upvote',
          explanation: getRandomItem(expertVoteExplanations.upvote),
          votedAt: new Date()
        });
      });

      // Add downvotes
      downvotingExperts.forEach(expert => {
        expertVotes.push({
          expert: expert._id,
          voteType: 'downvote',
          explanation: getRandomItem(expertVoteExplanations.downvote),
          votedAt: new Date()
        });
      });

      const comment = {
        newsId: newsItem._id,
        commenter: commenter._id,
        comment: template.text,
        evidenceLinks: template.evidenceLinks.map(link => ({
          ...link,
          addedAt: new Date()
        })),
        expertVotes: expertVotes,
        upvoteCount: upvoteCount,
        downvoteCount: downvoteCount,
        createdAt: new Date(),
        isProcessedForFiltering: false,
        filterGroupId: null,
        groupName: groupInfo.group,
        stance: 'in_favor'
      };

      comments.push(comment);
      commentIndex++;
    }
  }

  // Generate against comments
  for (const groupInfo of againstGroups) {
    const templates = commentTemplates.against[groupInfo.group];
    for (let i = 0; i < groupInfo.count; i++) {
      const template = templates[i % templates.length];
      const commenter = getRandomItem(communityUsers);
      
      // Generate expert votes (against comments get fewer upvotes)
      const expertVotes = [];
      const upvoteCount = Math.floor(Math.random() * 2) + 1; // 1-2 upvotes
      const downvoteCount = Math.floor(Math.random() * 2) + 3; // 3-4 downvotes
      
      const upvotingExperts = getRandomItems(expertUsers, upvoteCount);
      const remainingExperts = expertUsers.filter(expert => 
        !upvotingExperts.some(upvoter => upvoter._id.toString() === expert._id.toString())
      );
      const downvotingExperts = getRandomItems(remainingExperts, downvoteCount);

      // Add upvotes
      upvotingExperts.forEach(expert => {
        expertVotes.push({
          expert: expert._id,
          voteType: 'upvote',
          explanation: getRandomItem(expertVoteExplanations.upvote),
          votedAt: new Date()
        });
      });

      // Add downvotes
      downvotingExperts.forEach(expert => {
        expertVotes.push({
          expert: expert._id,
          voteType: 'downvote',
          explanation: getRandomItem(expertVoteExplanations.downvote),
          votedAt: new Date()
        });
      });

      const comment = {
        newsId: newsItem._id,
        commenter: commenter._id,
        comment: template.text,
        evidenceLinks: template.evidenceLinks.map(link => ({
          ...link,
          addedAt: new Date()
        })),
        expertVotes: expertVotes,
        upvoteCount: upvoteCount,
        downvoteCount: downvoteCount,
        createdAt: new Date(),
        isProcessedForFiltering: false,
        filterGroupId: null,
        groupName: groupInfo.group,
        stance: 'against'
      };

      comments.push(comment);
      commentIndex++;
    }
  }

  return comments;
};

// Main function
const addCommentsToRealNews = async () => {
  try {
    await connectDB();

    // Load real news data
    const realNewsData = JSON.parse(fs.readFileSync('inserted_real_news_entities.json', 'utf8'));
    console.log(`Found ${realNewsData.length} real news articles`);

    // Get community users
    const communityUsers = await CommunityUser.find({ isApproved: true });
    console.log(`Found ${communityUsers.length} approved community users`);

    // Get expert users
    const expertUsers = await ExpertUser.find({ isApproved: true });
    console.log(`Found ${expertUsers.length} approved expert users`);

    if (communityUsers.length < 5 || expertUsers.length < 5) {
      throw new Error('Insufficient users for comment generation');
    }

    const allResults = {};

    // Process each news article
    for (let i = 0; i < realNewsData.length; i++) {
      const newsItem = realNewsData[i];
      console.log(`\nProcessing news ${i + 1}: ${newsItem.title.substring(0, 50)}...`);

      // Generate comments for this news
      const comments = await generateCommentsForNews(newsItem, communityUsers, expertUsers);

      // Insert comments into database
      const insertedComments = [];
      for (const commentData of comments) {
        try {
          const comment = new CommunityComment(commentData);
          const savedComment = await comment.save();
          insertedComments.push(savedComment.toObject());
          console.log(`  ✓ Added comment: ${commentData.stance} - ${commentData.groupName}`);
        } catch (error) {
          console.error(`  ❌ Error saving comment:`, error.message);
        }
      }

      // Update news with comment references
      const commentIds = insertedComments.map(comment => comment._id);
      await News.findByIdAndUpdate(newsItem._id, {
        $push: { comments: { $each: commentIds } }
      });

      // Prepare results for this news
      const newsResults = {
        newsId: newsItem._id,
        newsTitle: newsItem.title,
        totalComments: insertedComments.length,
        inFavorComments: insertedComments.filter(c => c.stance === 'in_favor').length,
        againstComments: insertedComments.filter(c => c.stance === 'against').length,
        commentGroups: {
          strongSupport: insertedComments.filter(c => c.groupName === 'strongSupport'),
          factualValidation: insertedComments.filter(c => c.groupName === 'factualValidation'),
          importance: insertedComments.filter(c => c.groupName === 'importance'),
          credibleSources: insertedComments.filter(c => c.groupName === 'credibleSources'),
          publicInterest: insertedComments.filter(c => c.groupName === 'publicInterest'),
          wellResearched: insertedComments.filter(c => c.groupName === 'wellResearched'),
          timelyCoverage: insertedComments.filter(c => c.groupName === 'timelyCoverage'),
          balancedReporting: insertedComments.filter(c => c.groupName === 'balancedReporting'),
          biasedReporting: insertedComments.filter(c => c.groupName === 'biasedReporting'),
          incompleteInformation: insertedComments.filter(c => c.groupName === 'incompleteInformation'),
          misleadingHeadlines: insertedComments.filter(c => c.groupName === 'misleadingHeadlines'),
          sensationalism: insertedComments.filter(c => c.groupName === 'sensationalism')
        },
        comments: insertedComments
      };

      allResults[`news_${i + 1}`] = newsResults;

      // Save individual file for this news
      const filename = `news_${i + 1}_comments.json`;
      fs.writeFileSync(
        path.join(__dirname, filename),
        JSON.stringify(newsResults, null, 2)
      );

      console.log(`  ✓ Saved comments to ${filename}`);
    }

    // Save complete results
    fs.writeFileSync(
      path.join(__dirname, 'all_news_comments_complete.json'),
      JSON.stringify(allResults, null, 2)
    );

    // Generate summary
    const summary = {
      processedDate: new Date().toISOString(),
      totalNewsProcessed: realNewsData.length,
      totalCommentsAdded: Object.values(allResults).reduce((sum, news) => sum + news.totalComments, 0),
      totalInFavorComments: Object.values(allResults).reduce((sum, news) => sum + news.inFavorComments, 0),
      totalAgainstComments: Object.values(allResults).reduce((sum, news) => sum + news.againstComments, 0),
      communityUsersUsed: communityUsers.length,
      expertUsersUsed: expertUsers.length,
      filesGenerated: realNewsData.length + 2 // individual files + complete file + summary
    };

    fs.writeFileSync(
      path.join(__dirname, 'comment_generation_summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log('\n=== COMMENT GENERATION SUMMARY ===');
    console.log(`✓ Total news processed: ${summary.totalNewsProcessed}`);
    console.log(`✓ Total comments added: ${summary.totalCommentsAdded}`);
    console.log(`✓ In favor comments: ${summary.totalInFavorComments}`);
    console.log(`✓ Against comments: ${summary.totalAgainstComments}`);
    console.log(`✓ Files generated: ${summary.filesGenerated}`);

  } catch (error) {
    console.error('Error in addCommentsToRealNews:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run the script
if (require.main === module) {
  addCommentsToRealNews();
}

module.exports = { addCommentsToRealNews, generateCommentsForNews };